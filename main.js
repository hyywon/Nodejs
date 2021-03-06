  var http = require('http');
  var fs = require('fs');
  var url = require('url');
  var qs = require('querystring');
  var path = require('path');
  var template = require('./lib/template.js');
  var sanitizeHtml = require('sanitize-html');


  var app = http.createServer(function (request, response) {
    var _url = request.url; //queryString이 포함됨 
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    //parse 함수를 이용해서 쿼리 파싱
    if (pathname === '/') {
      if (queryData.id === undefined) {
        fs.readdir('./data', function (error, filelist) {
          queryData.id = 'Welcome';
          var description = 'Hello Nodejs!';
          var list = template.list(filelist);
          var html = template.html(queryData.id, list, `<h2>${queryData.id}</h2>${description}`,
            `<a href="/create">create</a> `
          );
          response.writeHead(200);
          response.end(html);
        })
      } else {
        fs.readdir('./data', function (error, filelist) {
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description);
            var list = template.list(filelist);
            var html = template.html(sanitizedTitle, list, `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
              ` <a href="/create">create</a> <a href="/update?id=${sanitizedTitle}"> update </a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete"> </form>`   
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if (pathname === '/create') {
      fs.readdir('./data', function (error, filelist) {
        var title = 'WEB-create';
        var list = template.list(filelist);
        var html = template.html(queryData.id, list, `
        <form action="/create_process" method="post">
          <p><input type="text" name="title" placeholder="title"></p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `, '');
        response.writeHead(200);
        response.end(html);
      });
    } else if (pathname === '/create_process') {
      var body = '';
      //createServer함수에 callback함수 첫번째 인자, 요청할 때 웹브라우저가 전송한 정보
      request.on('data', function (data) {
        //post 방식으로 전송한 데이터가 많을 때, 서버에서 데이터를 수신할 때 마다 callback 함수 호출하도록
        body = body + data;

      });

      request.on('end', function () {
        //들어올 정보가 없다면 end 다음 callback 함수가 실행됨
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
          response.writeHead(302, { Location: `/?id=${title}` });
          response.end();
        })
      });

    } else if (pathname === '/update') {
      fs.readdir('./data', function (error, filelist) {
        var filteredId = path.parse(queryData.id).path
        fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.html(title, list,
            `
            <form action="/update_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <p><input type="text" name="title" placeholder="title" value="${title}"></p>
            <p>
              <textarea name="description" placeholder="description"> ${description}</textarea>
            </p>
            <p>
              <input type="submit">
            </p>
            </form> 
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}"> update </a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    }else if(pathname === '/update_process'){
      var body = '';
      request.on('data', function (data) {
        //post 방식으로 전송한 데이터가 많을 때, 서버에서 데이터를 수신할 때 마다 callback 함수 호출하도록
        body = body + data;
      });

      request.on('end', function () {
        //들어올 정보가 없다면 end 다음 callback 함수가 실행됨
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        var id = post.id;
        //file 이름 바꾸는 함수
        fs.rename(`data/${id}`,`data/${title}`,function(error){
          fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
            response.writeHead(302, { Location: `/?id=${title}` });
            response.end();
          }) 
        });
      });
    }else if(pathname === '/delete_process'){
      var body = '';
      request.on('data', function (data) {
      //post 방식으로 전송한 데이터가 많을 때, 서버에서 데이터를 수신할 때 마다 callback 함수 호출하도록
        body = body + data;
      });

      request.on('end', function () {
        //들어올 정보가 없다면 end 다음 callback 함수가 실행됨
        var post = qs.parse(body);
        var id = post.id;
        var filteredId = path.parse(id).path
        fs.unlink(`data/${filteredId}`,function(error){
          response.writeHead(302, {Location: `/`});
          response.end();
        })
      });


    }else {
      //화면에 출력 
      response.writeHead(404);
      response.end('Not Found');
    }
  });
  app.listen(3000);
