const mysql = require('mysql2/promise'); // 불러와주기
// db가져오는 형식
var db_info = {
    host: 'database.cj2yw4ㅑkschmz.ap-northeast-2.rds.amazonaws.com',
    port: '3306',
    user: 'admin',
    password: '',
    database: 'pooreum',
};
const getConnection = async () => {
    // db 정보를 가져와주는 함수
    return mysql.createConnection(db_info);
};
module.exports = {
    getConnection,
};
// module.exports = {
//     init: async function () {
//         return await mysql.createConnection(db_info);
//     },
//     connect: function (conn) {
//         conn.connect(function (err) {
//             if (err) console.error('mysql connection error : ' + err);
//             else console.log('mysql is connected successfully');
//         });
//     },
// };
