console.log("hello")

const path = require('path')
const fs = require('fs-extra')
const Crawler = require("simplecrawler")
const crawler = new Crawler("https://mhworld.kiranico.com/")
// const crawler = new Crawler("https://mhworld.kiranico.com" + startPath)

crawler.cache = new Crawler.cache(path.join(__dirname, 'cache'))
crawler.interval = 3000 // Ten seconds
crawler.maxConcurrency = 3
crawler.maxDepth = 4
crawler.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36'
crawler.parseHTMLComments = false
crawler.parseScriptTags = false
crawler.downloadUnsupported = false
crawler.supportedMimeTypes = [
  /text\/html/,
  /image\/\w+/
]

crawler.addFetchCondition(function (queueItem, refQueueItem, callback) {
  let fetch = true
    && !/\/fr\b/.test(queueItem.path)
    && !/\.css\b/.test(queueItem.path)
    && !/\.js\b/.test(queueItem.path)
    // && /\.(png|jpe?g|gif)\b/.test(queueItem.path)
  // console.log("fetchCondition", fetch, queueItem.path, refQueueItem.path)
  callback(null, fetch)
})
crawler.addDownloadCondition(function (queueItem, res, callback) {
  let download = false
    || /text\/html/.test(queueItem.stateData.contentType)
    || /image\/\w+/.test(queueItem.stateData.contentType)
  // console.log("downloadCondition", download, queueItem.path)
  callback(null, download)
})
crawler.on('crawlstart', function () {
  console.log("crawlstart")
})
crawler.on('queueerror', function (error, urlData) {
  console.log("queueerror", error, urlData)
})
crawler.on('robotstxterror', function (error) {
  console.log("robotstxterror", error)
})
crawler.on('invaliddomain', function (queueItem) {
  console.log("invaliddomain", queueItem.url)
})
crawler.on('fetchdisallowed', function (queueItem) {
  console.log("fetchdisallowed", queueItem.url)
})
crawler.on('fetchprevented', function (queueItem) {
  console.log("fetchprevented", queueItem.url)
})
crawler.on('fetchredirect', function (oldQueueItem, redirectQueueItem, responseObject) {
  console.log("fetchredirect", oldQueueItem.url, redirectQueueItem.url)
})
crawler.on('fetch404', function (queueItem) {
  console.log("fetch404", queueItem.url)
})
crawler.on('fetcherror', function (queueItem) {
  console.log("fetcherror", queueItem.url)
})
crawler.on('fetchclienterror', function (queueItem, error) {
  console.log("fetchclienterror", queueItem.url, error)
})
crawler.on('fetchdataerror', function (queueItem) {
  console.log("fetchdataerror", queueItem.url)
})
crawler.on('fetchtimeout', function (queueItem) {
  console.log("fetchtimeout", queueItem.url)
})
crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
  // console.log("fetchcomplete", queueItem.url, queueItem.stateData.contentType, response.headers['content-type'], responseBuffer.length)
  let dest = path.join(process.cwd(), 'download', queueItem.path)
  switch (true) {
    case /text\/html/.test(queueItem.stateData.contentType):
      dest += '.html'
      break
    case /image\/\w+/.test(queueItem.stateData.contentType):
      break
    default:
      return
  }

  let destDir = path.dirname(dest)

  console.log("download", queueItem.path, dest)
  fs.ensureDirSync(destDir)
  fs.writeFile(dest, responseBuffer)
})
crawler.on("discoverycomplete", function(queueItem, resources) {
  // console.log("discoverycomplete %s (%s bytes)", queueItem.url/*, '  ' + resources.join('\n  ')*/)
})
crawler.on('complete', function () {
  console.log("complete")
})

crawler.start()
