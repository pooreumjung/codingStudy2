// 기본적인 node.js 세팅
const express = require('express');
const app = express();
const http = require('http');
const cookieParser = require('cookie-parser');

// mysql 세팅
const db = require('./config/mysql.js');

// app 세팅
app.use(express.json()); // json을 사용하겠다~
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser()); // cookie-parser 미들웨어 사용
app.set('view engine', 'html');

const middleware = async (req, res, next) => {
    // 로그인이 되지 않았을 때는 게시판으로 넘어가지 않게 하기
    let allowedUrls = ['/', '/board/signup']; // 예외 url설정, 메인화면과 회원가입 페이지 => 쿠키가 필요없음
    let isLoginRequired = true; // 로그인이 필요한지

    for await (let allowedUrl of allowedUrls) {
        if (req.path == allowedUrl) {
            // 만약 path == 허락한 url이라면 cookie를 생성해야 함
            isLoginRequired = false; // false 3처리해주고
        }
    }

    if (isLoginRequired && !req.cookies.id) {
        // 로그인이 필요하면서 쿠키를 생성하려면 메인화면으로
        return res.redirect('/');
    }
    // 그게 아니라면 next때려버리기
    return next();
};

app.use(middleware);

// nunjucks 템플릿 설정
const nunjucks = require('nunjucks'); // 템플릿? 검색하다가 있길래
nunjucks.configure('views', {
    express: app,
    watch: true,
});

// http.createServer(function (req, res) {
//     res.writeHead(200, {
//         'Set-Cookie': 'c1=cookie1!',
//         'Content-Type': 'text/html; charset=utf-8',
//     });
// });

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
        id: req.cookies.id,
    });
});

// 글을 쓰는 창
app.get('/board/write', async function (req, res) {
    // 글을 쓰는 창을 넘어갔을 때 작성자에 로그인한 id가 떠야 됨
    // 그럴려면 현재 가지고 있는 쿠키의 id값을 가져온다
    // 그리고 나서 render할때 id값을 같이 넘겨줘서 출력을 하게 한다!

    let id = req.cookies.id;
    console.log(id);

    return res.render('board_write.html', {
        content: id,
    });
});

// 작성하기를 누르면 알아서 board/list로 넘어가짐
app.post('/board/write', async function (req, res) {
    // 내가 필요한 정보들 알아오기
    const username = req.cookies.id;
    const subject = req.body.subject;
    const date = req.body.data;

    // db가져오기
    const conn = await db.getConnection();

    //sql문 작성하기, 변수를 집어넣을떄는 ?를 넣고, query문에서 인자로 값을 집어넣어주자
    let sql = 'insert into Board(subject, username,date) values(?,?,now())';

    // query문 안에서 쓰일 파라미터 값
    let values = [subject, username];
    let [result] = await conn.query(sql, values);
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
    const index = req.body.idx;
    const userID = req.cookies.id;
    let sql = `select idx from Board where username=? and idx=?`;
    const conn = await db.getConnection();
    let [result] = await conn.query(sql, [userID, index]);

    if (result.length === 0) {
        console.log('삭제 불가능');
        await conn.destroy();
        return res.redirect('/board/list');
    }

    let deleteSQL = `delete from Board where idx=?`;
    await conn.query(deleteSQL, [index]);
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
        // result값은 하나만 반환하는 것이 아니므로 배열에 들어가진다, 따라서 인덱싱을 통해 값을 가져올 것
        content: result[0],
    });
});
app.post('/board/update', async function (req, res) {
    // 입력한 값을 받아오기
    const index = req.body.idx;
    const subject = req.body.subject;
    const date = req.body.date;
    const userID = req.cookies.id;
    const conn = await db.getConnection();

    // 보드 테이블에서 쿠키 id를 통해 idx값을 디져서 같을 때에만 수정할 수 있도록 하고, 아니라면 홈페이지르 돌려버리자
    let checkSQL = `select idx from Board where username=? and idx=?`;
    let [checkResult] = await conn.query(checkSQL, [userID, index]);
    if (checkResult.length === 0) {
        console.log('수정할 수 없는 접근입니다');
        return res.redirect('/board/list');
    }

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
app.get('/', async function (req, res) {
    return res.render('border_list.html');
});
// 로그인 창
app.post('/', async function (req, res) {
    const id = req.body.id;
    const password = req.body.password;
    console.log('로그인 요청');
    const conn = await db.getConnection(); // db정보 가져오기

    let sql = `select id, email from User where id=? and password=? `;
    let values = [id, password];
    let [result] = await conn.query(sql, values);
    console.log(result);
    if (result.length > 0) {
        console.log('로그인 성공');
        res.cookie('id', id);
        return res.redirect('/board/list');
    } else {
        console.log('로그인 실패');
        return res.redirect('/');
    }
});
// 로그아웃 창
app.post('/board/logout', async function (req, res) {
    let id = req.cookies.id;
    res.clearCookie('id');
    return res.redirect('/');
});

// 회원가입 창 + 회원가입시 쿠키를 만들어주자
app.post('/board/signup', async function (req, res) {
    const id = req.body.id;
    const password = req.body.password;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;

    console.log('호출됨' + req);
    const conn = await db.getConnection(); // db정보 가져오기

    let checkSQL = `select * from User where id=?`;
    let [result2] = await conn.query(checkSQL, [id]);
    if (result2.length > 0) {
        await conn.destroy();
        console.log('이미 있는 아이디');
        return res.redirect('/board/signup');
    } else {
        let sql = 'insert into User(id,password,email,phoneNumber) values(?,?,?,?) ';
        let values = [id, password, email, phoneNumber];
        let [result] = await conn.query(sql, values);

        if (result) {
            console.log('성공');
            //res.write('<h2>회원가입 성공</h2>');
            res.cookie('id', id);
            return res.redirect('/');
        } else {
            console.log('실패');
            //res.write('<h2>회원가입 실패</h2>');
            return res.redirect('/');
        }
    }
});
app.get('/board/signup', async function (req, res) {
    return res.render('board_signup.html');
});

app.listen(3000, function () {
    // localhost:3000으로 ㄱㄱ
    console.log('서버시작');
});
