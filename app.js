const { watch } = require('chokidar');
const express = require('express');
const app = express();
const nunjucks = require('nunjucks'); // 템플릿? 검색하다가 있길래
let number = 1;
app.use(express.json()); // json을 사용하겠다~
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

let list = [
    {
        subject: '안녕하세요', //글제목
        username: 'pooreum', //작성자
        date: '2024-08-07', //날짜
    },
    {
        subject: '안녕하세요2',
        username: 'pooreum2',
        date: '2024-08-07',
    },
    {
        subject: '안녕하세요3',
        username: 'pooreum3',
        date: '2024-08-07',
    },
    {
        subject: '안녕하세요4',
        username: 'pooreum4',
        date: '2024-08-07',
    },
    {
        subject: '안녕하세요5',
        username: 'pooreum5',
        date: '2024-08-07',
    },
]; // 유저 정보를 담을 리스트

//게시판 메인 페이지
app.get('/', function (req, res) {
    res.render('index.html');
});

// board 창
app.get('/board/list', function (req, res) {
    res.render('board_list.html', {
        content: list,
    });
});

// 글을 쓰는 창
app.get('/board/write', function (req, res) {
    res.render('board_write.html');
});

// 작성하기를 누르면 알아서 board/list로 넘어가짐
app.post('/board/write', function (req, res) {
    list.push(req.body); // 유저 정보를 담는 리스트에 board(req.body값 넣어주기)
    console.log(list);
    // res.send('ok');
    res.redirect('/board/list'); // redirect는 해당 url로 get요청을 자동으로 해준다 => board/list창으로 자동으로 넘어가짐
});

app.get('/board/view', function (req, res) {
    // view를 주소 창에 입력하면 자동으로 board_view.html을 그려준다?
    // 보더 뷰 html을 랜더링 하겠다
    console.log(list);
    res.render('board_view.html'); // render는 서버에서 클라이언트에게 HTML을 생성하고 전달하는데 사용, 템플릿(nunjucks)를 사용하여 html코드를 동적으로 사용
    // 템플릿 파일을 랜더링하여 클라이언트에게 전송, 즉 서버측에서 페이지를 구성한 후 전송(ssr)
});

//글을 삭제하기
app.post('/board/delete', function (req, res) {
    const index = req.body.index;
    list.splice(index, 1);
    res.redirect('/board/list');
});

//글 업데이트하기
app.get('/board/update', function (req, res) {
    const index = req.query.index;
    const view = list[index];
    res.render('board_update.html', {
        data: view,
        index: index,
    });
});
app.post('/board/update', function (req, res) {
    const index = req.body.index;
    const item = {
        subject: req.body.subject,
        username: req.body.username,
        date: req.body.date,
    };
    list[index] = item;
    res.redirect(`/board/update?index=${index}`);
});

// 게시물 클릭하면 보기 창
app.get('/board/view', function (req, res) {
    const index = req.query.index;
    const view = list[index - 1];
    res.render('border_view.html', {
        data: view,
        index: index,
    });
});

app.listen(3000, function () {
    // localhost:3000으로 ㄱㄱ
    console.log('서버시작');
});
