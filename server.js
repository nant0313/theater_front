const express = require('express');
const app = express();
const port = process.env.PORT || 2501;
const path = require('path');
const fs = require('fs')
const rss = require('rss');

const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const mysql2 = require('mysql2');
const connection = mysql2.createPool({
  host: process.env.MYSQL2_HOST,
  user: process.env.MYSQL2_USER,
  password: process.env.MYSQL2_PW,
  database: process.env.MYSQL2_DB
});
app.use(cors());
app.use(express.static(path.resolve(__dirname, './build')));
// __dirname 여기까지의 주소
app.get('/rss', (req, res) => {
  const filePath = path.resolve(__dirname, './build/rss.xml');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return console.log(err);
    res.set('Content-Type', 'text/xml');
    res.end(data);
  })
})
app.get('/story/:id', (request, response) => {
  const filePath = path.resolve(__dirname, './build', 'index.html');
  let url = request.url.split('/');
  connection.query('SELECT * FROM story WHERE idx = ?', [url[2]], (err1, result, fields) => {
    if (err1) console.log(err1);
    else if (result.length === 0) return response.end('bad request')
    else
      fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        const cont = new JSDOM("<html>" + result[0].content + "</html>");
        let cont1 = cont.window.document.querySelector('html').textContent.trim();
        cont1 = cont1.replace(/(\r\n|\n|\r)/gm, " ");
        cont1 = cont1.replace(/"/g, "");
        data = data.replace(/href="https:\/\/blog.soga.ng"/g, 'href="https://blog.soga.ng' + request.url.split('?')[0] + '"');
        data = data.replace(/content="https:\/\/blog.soga.ng"/g, 'content="https://blog.soga.ng' + request.url + '"');
        data = data.replace(/36부작/g, result[0].title);
        data = data.replace(/컴퓨터공학과 학부생의 낙서장/g, cont1);
        data = data.replace(/this.props.imageUrl/g, 'https://blog.soga.ng' + getImgSrc(result[0].content) === null ? "" : getImgSrc(result[0].content));

        response.setHeader("Access-Control-Allow-Origin", "*");
        response.send(data);
      });
  })
})
app.get('*', function (request, response) {
  const filePath = path.resolve(__dirname, './build', 'index.html');
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.send(data);
  });
});


app.listen(port, () => console.log(`Listening on port ${port}`));

function getTextElement(s) {
  let span = document.createElement('span');
  span.innerHTML = s;
  return span.textContent || span.innerText;
}
function getImgSrc(s) {
  let regex = /<img.*?src="([^">]*\/([^">]*?))".*?>/g, ret;
  ret = regex.exec(s);
  if (ret)
    return ret[1];
  else
    return null;
}