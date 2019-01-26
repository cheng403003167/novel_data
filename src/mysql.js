var mysql = require('mysql');
var configInfo = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'xiaoshuo_new'
}
connection.on('error',function(err){
  console.log(err.code);
})
connection.connect(err=>{
  if(err){
    console.error('error connection: ' + err.stack);
    return;
  }
});
class insertDate {
  constructor(date){
    this.date = date;
    this.conn = mysql.createConnection(configInfo);
    this.conn.on('error',err=>console.log(err.code));
  }
  // 创建链接并开始插入数据
  createConnInsert(){
    this.conn.connect(err=>{
      if(err){
        console.error('error connection: ' + err.stack);
        return;
      }
    })
  }
}