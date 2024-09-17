import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "fiveway",
  description: "A VitePress Site",
  themeConfig: {
    logo: { src: '/logo-small.png', width: 24, height: 24 },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is fiveway?', link: '/what-is-fiveway' },
          { text: 'Getting started', link: '/getting-started' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/silen-z/fiveway' }
    ],

   
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo-small.png' }],
  ]
})
