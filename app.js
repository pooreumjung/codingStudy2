// 기본적인 node.js 세팅
const express = require('express');
const app = express();

// mysql 세팅
const db = require('./config/mysql.js');

// app 세팅
app.use(express.json()); // json을 사용하겠다~
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'html');

// nunjucks 템플릿 설정
const nunjucks = require('nunjucks'); // 템플릿? 검색하다가 있길래
nunjucks.configure('views', {
    express: app,
    watch: true,
});

//게시판 메인 페이지
app.get('/', function (req, res) {
    return res.render('index.html');
});

// board 창
app.get('/board/list', async function (req, res) {
    const conn = await db.getConnection(); // db정보 가져오기

    // sql문 설정
    var sql = 'select idx,subject,username, date_format(date,"%Y-%m-%d") as date  from Board';
    let [result] = await conn.query(sql);

    // 연결 끊어주기
    await conn.destroy();
    return res.render('board_list.html', {
        content: result,
    });
});

// 글을 쓰는 창
app.get('/board/write', async function (req, res) {
    return res.render('board_write.html');
});

// 작성하기를 누르면 알아서 board/list로 넘어가짐
app.post('/board/write', async function (req, res) {
    // 내가 필요한 정보들 알아오기
    const username = req.body.username;
    const subject = req.body.subject;
    const date = req.body.data;

    // db가져오기
    const conn = await db.getConnection();

    //sql문 작성하기, 변수를 집어넣을떄는 ?를 넣고, query문에서 인자로 값을 집어넣어주자
    let sql = 'insert into Board(subject, username,date) values(?,?,now())';

    // query문 안에서 쓰일 파라미터 값
    let values = [subject, username];
    await conn.query(sql, values);
    await conn.destroy();
    return res.redirect('/board/list');
});

app.get('/board/view', function (req, res) {
    // view를 주소 창에 입력하면 자동으로 board_view.html을 그려준다?
    // 보더 뷰 html을 랜더링 하겠다
    console.log(list);
    res.render('board_view.html'); // render는 서버에서 클라이언트에게 HTML을 생성하고 전달하는데 사용, 템플릿(nunjucks)를 사용하여 html코드를 동적으로 사용
    // 템플릿 파일을 랜더링하여 클라이언트에게 전송, 즉 서버측에서 페이지를 구성한 후 전송(ssr)
});

//글을 삭제하기
app.post('/board/delete', async function (req, res) {
    const conn = await db.getConnection();

    // 글을 삭제하기 위해서는 고유값인 idx값을 알아와야됨
    let index = req.body.idx;
    let sql = `delete from Board where idx=?`;

    // 마찬가지로 index값을 배열에 넣어서
    await conn.query(sql, [index]);
    await conn.destroy();
    return res.redirect('/board/list');
});

//글 업데이트하기
app.get('/board/update', async function (req, res) {
    // 먼저 수정하기를 누르면 그 항목을 보여줘야 함
    // 근데 내가 아는건 idx번호밖에 없어
    // where idx=index를 이용해서 db를 select하고 나서
    // 그 값들을 화면에 출력해주자
    const index = req.query.index;
    const conn = await db.getConnection();

    // sql문 작성
    let sql = "select idx,subject,username, date_format(date,'%Y-%m-%d') as date from Board where idx=?";
    let [result] = await conn.query(sql, [index]);
    if (result.length !== 1) {
        //확인 검사
        return res.redirect('/board/list');
    }
    // 응답하는 거는 앞에 return을 붙여주는 것이 좋다
    await conn.destroy();
    return res.render('board_update.html', {
        // reultr값은 하나만 반환하는 것이 아니므로 배열에 들어가진다, 따라서 인덱싱을 통해 값을 가져올 것
        content: result[0],
    });
});
app.post('/board/update', async function (req, res) {
    // 입력한 값을 받아오기
    const index = req.body.idx;
    const subject = req.body.subject;
    const username = req.body.username;
    const date = req.body.date;
    const conn = await db.getConnection();
    console.log(index);

    // db가져올 sql문 작성하기
    let sql = `update Board set username=?, subject=?, date=? where idx=?`;
    let values = [username, subject, date, index];
    await conn.query(sql, values);
    await conn.destroy();
    return res.redirect(`/board/list`);
});

// 게시물 클릭하면 보기 창
app.get('/board/view', function (req, res) {
    const index = req.query.idx;
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
