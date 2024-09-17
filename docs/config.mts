import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "fiveway",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // nav: [
    //   { text: 'Home', link: '/' },
    //   { text: 'Examples', link: '/markdown-examples' }
    // ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Why fiveway', link: '/why' },
          { text: 'Getting started', link: '/getting-started' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/silen-z/fiveway' }
    ]
  }
})
