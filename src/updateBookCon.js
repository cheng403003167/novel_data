const crawlCon = require('./bin/getBookCon');
const insertDatejs = require('./bin/updatamysql');
const fs = require('fs');
const booklist = './src/bin/booklist.txt';

class upDateCon {
  constructor(){
    this.insertDate = new insertDatejs({openFile:0});
    const fd = fs.openSync(booklist,'r');
    let bookList = fs.readFileSync(fd,'utf-8');
    bookList = bookList.split(',');
    this.hasBook = bookList.length-1;
  }
  async main(num){
    this.currentBookNum = num;
    let bookName = await this.insertDate.getBookName(num);
    let bookTrueName = '';
    let that = this;
    bookName.on('err',function(err){
      console.log(err);
    }).on('result',async function(row){
      bookTrueName = JSON.parse(JSON.stringify(row)).name;
      let bookNum = await that.insertDate.checkBookChapter(JSON.parse(JSON.stringify(row)).name);
      bookNum.on('err',function(err){
        console.log(err);
      }).on('result',async function(row){
        that.chapterPage = new crawlCon({name:bookTrueName,startChapter:JSON.parse(JSON.stringify(row)).count,needGetChapter:10});
        await that.chapterPage.defineBrowser();
        that.startN = JSON.parse(JSON.stringify(row)).count;
        await that.chapterPage.getsouDate();
        await that.insertDate.insertChapter(that.chapterPage.chapterData,false);
        console.log('第'+that.startN+'到'+'第'+(that.startN+10)+'插入完成')
        while(that.chapterPage.bookEnd !=1 ){
          await that.criclCon();
        }
        if(that.chapterPage.bookEnd == 1){
          that.chapterPage.cleanData();
          await that.chapterPage.closeBrowser();
        }
        if(that.currentBookNum < that.hasBook){
          await that.main(++that.currentBookNum);
        }else{
          await that.insertDate.connentClose();
        }
      })
    })
  }
  async criclCon(){
    if(this.chapterPage.startChapter == this.chapterPage.endGetChapter){
      this.startN = this.chapterPage.endGetChapter;
    }
    await this.chapterPage.getOtherCric(this.startN,10);
    await this.insertDate.insertChapter(this.chapterPage.chapterData,true);
    console.log('第'+this.startN+'到'+'第'+(this.startN+10)+'插入完成')
  }
}
(async ()=>{
  const ci = new upDateCon();
  await ci.main(4);
})()
