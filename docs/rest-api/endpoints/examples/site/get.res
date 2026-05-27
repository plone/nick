HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@site",
  "features": {
    "multilingual": false
  },
  "plone.available_languages": [
    "en",
    "nl",
    "sv"
  ],
  "plone.default_language": "en",
  "plone.robots_txt": "Sitemap: {portal_url}/sitemap.xml.gz\n\n# Define access-restrictions for robots/spiders\n# http://www.robotstxt.org/wc/norobots.html\n\n\n\n# By default we allow robots to access all areas of our site\n# already accessible to anonymous users\n\nUser-agent: *\nDisallow:\n\n\n\n# Add Googlebot-specific syntax extension to exclude forms\n# that are repeated for each piece of content in the site\n# the wildcard is only supported by Googlebot\n# http://www.google.com/support/webmasters/bin/answer.py?answer=40367&ctx=sibling\n\nUser-Agent: Googlebot\nDisallow: /*?\nDisallow: /*atct_album_view$\nDisallow: /*folder_factories$\nDisallow: /*folder_summary_view$\nDisallow: /*login_form$\nDisallow: /*mail_password_form$\nDisallow: /@@search\nDisallow: /*search_rss$\nDisallow: /*sendto_form$\nDisallow: /*summary_view$\nDisallow: /*thumbnail_view$\nDisallow: /*view$\n",
  "plone.site_logo": null,
  "plone.site_title": "Nick"
}