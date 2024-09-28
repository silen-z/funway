import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "fiveway",
  description: "TypeScript library for rich web applications that want to support keyboard navigation and have precise control over what is focused", 
  cleanUrls: true,
  themeConfig: {
    search: {
      provider: 'local'
    }, 
    logo: { src: '/logo-small.png', width: 24, height: 24 },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Demo', link: 'https://react-demo.fiveway.io' }
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
