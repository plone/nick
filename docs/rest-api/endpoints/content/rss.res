HTTP/1.1 200 OK
Content-Type: text/calendar

<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Events</title>
    <description></description>
    <language>en</language>
    <link>http://localhost:8080/events</link>
    <lastBuildDate>Sat, 01 Jan 2022 00:00:00 GMT</lastBuildDate>
    <managingEditor>admin@example.com (Admin)</managingEditor>
      <item>
        <title>Event 1</title>
        <link>http://localhost:8080/events/event-1</link>
        <guid>405ca717-0c68-43a0-88ac-629a82658675</guid>
        <pubDate>Sat, 02 Apr 2022 20:10:00 GMT</pubDate>
        <description></description>
      </item>
      <item>
        <title>Event 2</title>
        <link>http://localhost:8080/events/event-2</link>
        <guid>455ca717-0c68-43a0-88ac-629a82658675</guid>
        <pubDate>Sun, 02 Apr 2023 20:10:00 GMT</pubDate>
        <description></description>
      </item>
  </channel>
</rss>