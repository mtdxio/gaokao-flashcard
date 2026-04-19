export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }

    if (request.method === 'OPTIONS') {
      return new Response('', { headers: corsHeaders })
    }

    // Root - serve HTML
    if (path === '/' || path === '/index.html') {
      const html = await env.HTML ? env.HTML.fetch(url) : new Response('Not Found', { status: 404 })
      return new Response(html.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Login API
    if (path === '/api/login') {
      const { username, password } = await request.json()
      const userKey = `user:${username}`
      const user = await env.USERS.get(userKey, 'json')

      if (!user) {
        return new Response(JSON.stringify({ error: '用户不存在' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (user.password !== password) {
        return new Response(JSON.stringify({ error: '密码错误' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        user: { username: user.username, nickname: user.nickname }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Register API
    if (path === '/api/register') {
      const { username, password, nickname } = await request.json()
      const userKey = `user:${username}`
      const existing = await env.USERS.get(userKey)

      if (existing) {
        return new Response(JSON.stringify({ error: '用户名已存在' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      await env.USERS.put(userKey, JSON.stringify({ username, password, nickname: nickname || username }))

      return new Response(JSON.stringify({
        success: true,
        user: { username, nickname: nickname || username }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Progress API
    if (path === '/api/progress') {
      const username = url.searchParams.get('username')
      if (!username) {
        return new Response(JSON.stringify({ error: '需要登录' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (request.method === 'GET') {
        const progressKey = `progress:${username}`
        const data = await env.USERS.get(progressKey, 'json')
        return new Response(JSON.stringify(data || {}), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (request.method === 'POST') {
        const data = await request.json()
        const progressKey = `progress:${username}`
        await env.USERS.put(progressKey, JSON.stringify(data))
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}