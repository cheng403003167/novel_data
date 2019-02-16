var mysql = require('mysql');
const fs = require('fs');
const booklist = './src/bin/booklist.txt';
var configInfo = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'xiaoshuo_new'
}

class insertDate {
  constructor({dataArr=[]}={},openFile=1){
    this.data = dataArr;
    this.len = this.data.length;
    this.i = 0;
    this.conn = mysql.createConnection(configInfo);
    this.conn.on('error',err=>console.log(err.code));
    if(openFile == 1){
      this.fd = fs.openSync(booklist,'a+');
    }
  }
  // 插入数据
  async createConnInsert(){
    if(this.len>0){
      if(this.i<this.len){
        this.conn.query('INSERT INTO library SET ?',this.data[this.i],async (err,results)=>{
          if(err) throw err;
          // 数据备份
          fs.writeFileSync(this.fd,this.data[this.i].bid+',');
          this.i++;
          await this.createConnInsert()
        })
      }else{
        // 关闭文件
        fs.closeSync(this.fd);
        this.conn.end();
      }
    }else{
      // 关闭文件
      fs.closeSync(this.fd);
      this.conn.end();
      console.log('数据不存在');
    }
  }
  async updateData(){
    if(this.len > 0){
      if(this.i<this.len){
        this.conn.query('UPDATE library SET currentList = ? WHERE bid = ?',[this.data[this.i].currentList,this.data[this.i].bid],async (err,results)=>{
          if(err) throw err;
          // 数据备份
          this.i++;
          await this.updateData()
        })
      }else{
        this.conn.end();
      }
    }else{
      this.conn.end();
      console.log('没有数据传入');
    }
  }
  async getBookList(start,blank){
    if(!this.bookStart){
      this.bookStart = start
    };
    return await this.conn.query('SELECT status,score,totalChapter,totalNumber,bookLink,bid FROM library ORDER BY currentList  LIMIT ?,?',[this.bookStart,blank]);
  }
  async updateDes(data){
    this.data = data;
    this.len = data.length;
    if(this.len > 0){
      if(this.i<this.len){
        let thati = this.data[this.i];
        let tempA = [thati.status,thati.score,thati.totalChapter,thati.totalNumber,thati.bid];
        this.conn.query('UPDATE library SET status = ?, score = ?, totalChapter = ?, totalNumber = ? WHERE bid = ?',tempA,async (err,results)=>{
          if(err) throw err;
          // 数据备份
          this.i++;
          await this.updateDes(this.data)
        })
      }else{
        this.conn.end();
      }
    }else{
      this.conn.end();
      console.log('没有数据传入');
    }
  }
  async getBookName(num){
    return await this.conn.query('SELECT name FROM library WHERE currentList = ?',num);
  }
  async checkBookChapter(name){
    return await this.conn.query('SELECT COUNT(*) AS count FROM bookCon WHERE name = ?',[name]);
  }
  async insertChapter(data,resetI){
    this.data = data;
    this.len = data.length;
    if(resetI){
      this.i = 0;
    }
    if(this.len > 0){
      if(this.i<this.len){
        await this.conn.query('INSERT INTO bookCon SET ?',this.data[this.i],async (err,results)=>{
          if(err) throw err;
          this.i++;
          await this.insertChapter(this.data,false)
        })
      }
    }
  }
  async connentClose(){
    await this.conn.end();
  }
}
module.exports = insertDate;