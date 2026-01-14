import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Util } from '../core/Utils'

type HttpClient = Pick<typeof axios, 'request'> | { request: (config: AxiosRequestConfig) => Promise<AxiosResponse> }

export interface QueryDiversityConfig {
  sources: Array<'google-trends' | 'reddit' | 'news' | 'wikipedia' | 'local-fallback' | 'cn-news'>
  deduplicate: boolean
  mixStrategies: boolean
  maxQueriesPerSource: number
  cacheMinutes: number
}

/**
 * QueryDiversityEngine fetches search queries from multiple sources to avoid patterns.
 * Supports Google Trends, Reddit, News APIs, Wikipedia, and local fallbacks.
 */
export class QueryDiversityEngine {
  private config: QueryDiversityConfig
  private cache: Map<string, { queries: string[]; expires: number }> = new Map()
  private util: Util = new Util()
  private logger?: (source: string, message: string, level?: 'info' | 'warn' | 'error') => void
  private httpClient: HttpClient

  constructor(config?: Partial<QueryDiversityConfig>, logger?: (source: string, message: string, level?: 'info' | 'warn' | 'error') => void, httpClient?: HttpClient) {
    const maxQueriesPerSource = Math.max(1, Math.min(config?.maxQueriesPerSource || 10, 50))
    const cacheMinutes = Math.max(1, Math.min(config?.cacheMinutes || 30, 1440))

    this.config = {
      sources: config?.sources && config.sources.length > 0
        ? config.sources
        : ['google-trends', 'reddit', 'local-fallback'],
      deduplicate: config?.deduplicate !== false,
      mixStrategies: config?.mixStrategies !== false,
      maxQueriesPerSource,
      cacheMinutes
    }
    this.logger = logger
    this.httpClient = httpClient || axios
  }

  private log(source: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.logger) {
      this.logger(source, message, level)
    }
  }

  /**
   * Generic HTTP fetch with error handling and timeout
   */
  private async fetchHttp(url: string, config?: {
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    data?: string
    timeout?: number
  }): Promise<string> {
    try {
      const response = await this.httpClient.request({
        url,
        method: config?.method || 'GET',
        headers: config?.headers || { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        data: config?.data,
        timeout: config?.timeout || 10000
      })
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.log('QUERY-FETCH', `HTTP request failed for ${url}: ${errorMsg}`, 'error')
      throw error
    }
  }

  /**
   * Fetch diverse queries from configured sources
   */
  async fetchQueries(count: number): Promise<string[]> {
    const validCount = Math.max(1, Math.min(count, 200))
    const allQueries: string[] = []

    for (const sourceName of this.config.sources) {
      try {
        const queries = await this.getFromSource(sourceName)
        allQueries.push(...queries.slice(0, this.config.maxQueriesPerSource))
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        this.log('QUERY-DIVERSITY', `Failed to fetch from ${sourceName}: ${errorMsg}`, 'warn')
      }
    }

    let final = this.config.deduplicate ? Array.from(new Set(allQueries)) : allQueries

    if (this.config.mixStrategies && this.config.sources.length > 1) {
      final = this.interleaveQueries(final, validCount)
    }

    final = this.util.shuffleArray(final).slice(0, validCount)

    if (final.length === 0) {
      this.log('QUERY-DIVERSITY', 'All sources failed, using local fallback', 'warn')
      return this.getLocalFallback(validCount)
    }

    return final
  }

  /**
   * Fetch from a specific source with caching
   */
  private async getFromSource(source: string): Promise<string[]> {
    this.cleanExpiredCache()

    const cached = this.cache.get(source)
    if (cached && Date.now() < cached.expires) {
      return cached.queries
    }

    let queries: string[] = []

    switch (source) {
      case 'google-trends':
        queries = await this.fetchGoogleTrends()
        break
      case 'reddit':
        queries = await this.fetchReddit()
        break
      case 'news':
        queries = await this.fetchNews()
        break
      case 'cn-news':
        queries = await this.fetchCnNews()
        break
      case 'wikipedia':
        queries = await this.fetchWikipedia()
        break
      case 'local-fallback':
        queries = this.getLocalFallback(20)
        break
      default:
        this.log('QUERY-DIVERSITY', `Unknown source: ${source}`, 'warn')
        break
    }

    if (queries.length === 0) {
      this.log('QUERY-DIVERSITY', `No queries returned for source: ${source}`, 'warn')
    }

    if (queries.length > 0) {
      this.cache.set(source, {
        queries,
        expires: Date.now() + (this.config.cacheMinutes * 60000)
      })
    }

    return queries
  }

  /**
   * Fetch from Google Trends (existing logic can be reused)
   */
  private async fetchGoogleTrends(): Promise<string[]> {
    try {
      const data = await this.fetchHttp('https://trends.google.com/trends/api/dailytrends?geo=US')
      const cleaned = data.toString().replace(')]}\',', '')
      const parsed = JSON.parse(cleaned)

      const queries: string[] = []
      for (const item of parsed.default.trendingSearchesDays || []) {
        for (const search of item.trendingSearches || []) {
          if (search.title?.query) {
            queries.push(search.title.query)
          }
        }
      }

      return queries.slice(0, 20)
    } catch {
      return []
    }
  }

  /**
   * Fetch from Reddit (top posts from popular subreddits)
   */
  private async fetchReddit(): Promise<string[]> {
    try {
      const subreddits = ['news', 'worldnews', 'todayilearned', 'askreddit', 'technology']
      const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)]

      const data = await this.fetchHttp(`https://www.reddit.com/r/${randomSub}/hot.json?limit=15`)
      const parsed = JSON.parse(data)
      const posts = parsed.data?.children || []
      const queries: string[] = []

      for (const post of posts) {
        const title = post.data?.title
        if (title && title.length > 10 && title.length < 100) {
          queries.push(title)
        }
      }

      return queries
    } catch {
      return []
    }
  }

  /**
   * Fetch from News API (requires API key - fallback to headlines scraping)
   */
  private async fetchNews(): Promise<string[]> {
    try {
      const apiKey = process.env.NEWS_API_KEY
      if (!apiKey) {
        return this.fetchNewsFallback()
      }

      const data = await this.fetchHttp(`https://newsapi.org/v2/top-headlines?country=us&pageSize=15&apiKey=${apiKey}`)
      const parsed = JSON.parse(data)
      const articles = parsed.articles || []
      return articles.map((a: { title?: string }) => a.title).filter((t: string | undefined) => t && t.length > 10)
    } catch {
      return this.fetchNewsFallback()
    }
  }

  /**
   * Fallback news scraper (BBC/CNN headlines)
   */
  private async fetchNewsFallback(): Promise<string[]> {
    try {
      const html = await this.fetchHttp('https://www.bbc.com/news')
      const regex = /<h3[^>]*>(.*?)<\/h3>/gi
      const matches: RegExpMatchArray[] = []
      let match
      while ((match = regex.exec(html)) !== null) {
        matches.push(match)
      }

      return matches
        .map(m => m[1]?.replace(/<[^>]+>/g, '').trim())
        .filter((t: string | undefined) => t && t.length > 10 && t.length < 100)
        .slice(0, 10) as string[]
    } catch {
      return []
    }
  }

  /**
   * Fetch from China hot topics (Baidu realtime hot list)
   */
  private async fetchCnNews(): Promise<string[]> {
    try {
      const endpoints = [
        'https://top.baidu.com/api/board?platform=wise&tab=realtime',
        'https://top.baidu.com/api/board?platform=pc&tab=realtime'
      ]

      for (const endpoint of endpoints) {
        const data = await this.fetchHttp(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: 'https://top.baidu.com/'
          },
          timeout: 8000
        })
        const queries = this.extractCnNewsFromJson(data)
        if (queries.length > 0) {
          return queries.slice(0, this.config.maxQueriesPerSource)
        }
      }

      const html = await this.fetchHttp('https://top.baidu.com/board?tab=realtime', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 8000
      })
      const htmlQueries = this.extractCnNewsFromHtml(html)
      if (htmlQueries.length === 0) {
        this.log('QUERY-DIVERSITY', 'CN news returned no items from JSON or HTML sources', 'warn')
      }
      return htmlQueries.slice(0, this.config.maxQueriesPerSource)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.log('QUERY-DIVERSITY', `CN news fetch failed: ${errorMsg}`, 'warn')
      return []
    }
  }

  private extractCnNewsFromJson(data: string): string[] {
    try {
      const parsed = JSON.parse(data)
      const cards = parsed?.data?.cards || parsed?.data?.cardList || []
      const items = cards.flatMap((card: {
        content?: Array<Record<string, unknown>>
        items?: Array<Record<string, unknown>>
        list?: Array<Record<string, unknown>>
        data?: Array<Record<string, unknown>>
      }) => {
        const containers = [card.content, card.items, card.list, card.data]
          .filter(Array.isArray)
          .flat() as Array<Record<string, unknown>>
        return containers.flatMap((entry: Record<string, unknown>) => this.unwrapCnNewsContainer(entry))
      })
      const listFallback = parsed?.data?.list || parsed?.data?.items || parsed?.data?.currentBoard?.list || []
      const combinedItems = items.length > 0 ? items : listFallback
      const queries = combinedItems
        .map((item: Record<string, unknown>) => this.pickCnNewsTitle(item))
        .filter((t: string | undefined) => t && t.length > 2 && t.length < 100) as string[]
      if (queries.length === 0) {
        const cardCount = Array.isArray(cards) ? cards.length : 0
        const itemCount = Array.isArray(combinedItems) ? combinedItems.length : 0
        this.log('QUERY-DIVERSITY', `CN news returned no items (cards=${cardCount}, items=${itemCount})`, 'warn')
      }
      return queries
    } catch {
      return []
    }
  }

  private unwrapCnNewsContainer(entry: Record<string, unknown>): Array<Record<string, unknown>> {
    const nestedArrays = [entry.content, entry.items, entry.list, entry.data]
      .filter(Array.isArray)
      .flat() as Array<Record<string, unknown>>
    if (nestedArrays.length > 0) {
      return nestedArrays.flatMap((nested: Record<string, unknown>) => this.unwrapCnNewsContainer(nested))
    }
    return [entry]
  }

  private extractCnNewsFromHtml(html: string): string[] {
    const results: string[] = []
    const patterns = [
      /<div[^>]*class="[^"]*c-single-text-ellipsis[^"]*"[^>]*>(.*?)<\/div>/gi,
      /<a[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/a>/gi
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const text = match[1]?.replace(/<[^>]+>/g, '').trim()
        if (text && text.length > 2 && text.length < 100) {
          results.push(text)
        }
      }
    }

    return Array.from(new Set(results))
  }

  private pickCnNewsTitle(item: Record<string, unknown>): string | undefined {
    const candidates = ['query', 'word', 'keyword', 'title', 'name', 'raw_title', 'display_name', 'show', 'topic', 'hotWord', 'hotWordShort', 'desc']
    for (const key of candidates) {
      const value = item[key]
      if (typeof value === 'string' && value.length > 2 && value.length < 100) {
        return value
      }
      if (value && typeof value === 'object') {
        const nested = value as Record<string, unknown>
        for (const nestedKey of candidates) {
          const nestedValue = nested[nestedKey]
          if (typeof nestedValue === 'string' && nestedValue.length > 2 && nestedValue.length < 100) {
            return nestedValue
          }
        }
      }
    }

    const fallback = Object.values(item).find(value => typeof value === 'string' && value.length > 2 && value.length < 100 && !value.startsWith('http'))
    return typeof fallback === 'string' ? fallback : undefined
  }

  /**
   * Fetch from Wikipedia (featured articles / trending topics)
   */
  private async fetchWikipedia(): Promise<string[]> {
    try {
      const data = await this.fetchHttp('https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=15&format=json')
      const parsed = JSON.parse(data)
      const pages = parsed.query?.random || []
      return pages.map((p: { title?: string }) => p.title).filter((t: string | undefined) => t && t.length > 3)
    } catch {
      return []
    }
  }

  /**
   * Local fallback queries (curated list)
   */
  private getLocalFallback(count: number): string[] {
    const fallback = [
      'weather forecast',
      'news today',
      'stock market',
      'sports scores',
      'movie reviews',
      'recipes',
      'travel destinations',
      'health tips',
      'technology news',
      'best restaurants near me',
      'how to cook pasta',
      'python tutorial',
      'world events',
      'climate change',
      'electric vehicles',
      'space exploration',
      'artificial intelligence',
      'cryptocurrency',
      'gaming news',
      'fashion trends',
      'fitness workout',
      'home improvement',
      'gardening tips',
      'pet care',
      'book recommendations',
      'music charts',
      'streaming shows',
      'historical events',
      'science discoveries',
      'education resources'
    ]

    return this.util.shuffleArray(fallback).slice(0, count)
  }

  /**
   * Interleave queries from different sources for diversity
   * Uses a simple round-robin approach based on order of sources in config
   */
  private interleaveQueries(queries: string[], targetCount: number): string[] {
    const result: string[] = []
    const queriesPerSource = Math.ceil(this.config.maxQueriesPerSource)
    const sourceCount = this.config.sources.length

    if (sourceCount === 0 || queries.length === 0) {
      return queries.slice(0, targetCount)
    }

    const chunkSize = queriesPerSource
    let sourceIndex = 0

    for (let i = 0; i < queries.length && result.length < targetCount; i++) {
      const currentChunkStart = sourceIndex * chunkSize
      const currentChunkEnd = currentChunkStart + chunkSize
      const query = queries[i]

      if (query && i >= currentChunkStart && i < currentChunkEnd) {
        result.push(query)
      }

      if (i === currentChunkEnd - 1) {
        sourceIndex = (sourceIndex + 1) % sourceCount
      }
    }

    return result.slice(0, targetCount)
  }

  /**
   * Clear cache (call between runs)
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clean expired entries from cache automatically
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expires) {
        this.cache.delete(key)
      }
    }
  }
}
