'use strict';

const axios = require('axios');
const { parseStringPromise } = require('xml2js');

module.exports.convert = async (event) => {
  let url, count = null;
  if(event.queryStringParameters){
    url = event.queryStringParameters.url;
    count = event.queryStringParameters.count;
  }
  return await fetchXML(url, count);
};


let fetchXML = (url, count) => {

  return axios.get(url)
    .then(res => parseStringPromise(res.data))
    .then(result => formatJSON(result, count))
    .catch(err => {
      return {
        statusCode: 400,
        body : JSON.stringify({
          status: "error",
          message: "Cannot download this RSS feed, make sure the Rss URL is correct."
        })
      }
    })

}

let formatJSON = (result, count) => {

  let object = result.rss.channel[0];

  let templates = {
      status : "ok",
      feed: {
          url: object["atom:link"] ? object["atom:link"][0].$.href : object.link && object.link[0],
          title: object.title && object.title[0],
          link: object.link && object.link[0]
      },
      items : object.item
        .map((item) => {
          return {
            title: item.title && item.title[0],
            pubDate: (item.pubDate && item.pubDate[0]) || (item['dc:date'] && item['dc:date'][0]),
            link: item.link && item.link[0],
            description: (item.description && item.description[0]) || (item['dc:description'] && item['dc:description'][0]),
            content:  (item.description && item.description[0]) || (item['dc:description'] && item['dc:description'][0])
          }
        })
        .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, count || 10)
  }

  return {
    statusCode : 200,
    body : JSON.stringify(templates)
  }
}

