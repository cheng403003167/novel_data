const crawlCon = require('./bin/getBookCon');
const insertDatejs = require('./bin/updatamysql');
const fs = require('fs');
const booklist = './src/bin/booklist.txt';

class upDateCon {
  constructor(){
    this.insertDate = new insertDatejs({openFile:0});
    const fd = fs.openSync(booklist,'r');
    let bookList = fs.readFileSync(fd,'utf-8');
    this.bookArr = bookList.split(',');
    this.hasBook = bookList.length-1;
  }
  async main(num,ins){
    this.currentBookNum = num;
    this.indes = ins;
    let bookName = await this.insertDate.getBookName(num);
    let that = this;
    bookName.on('err',function(err){
      console.log(err);
    }).on('result',async function(row){
      let bookTrueName = JSON.parse(JSON.stringify(row)).name;
      let bookNum = await that.insertDate.checkBookChapter(JSON.parse(JSON.stringify(row)).name);
      bookNum.on('err',function(err){
        console.log(err);
      }).on('result',async function(row){
        that.startN = JSON.parse(JSON.stringify(row)).count;
        that.chapterPage = new crawlCon({name:bookTrueName,startChapter:that.startN,needGetChapter:10});
        await that.chapterPage.defineBrowser();
        console.log('************')
        console.log(bookTrueName);
        await that.chapterPage.defineEvent('partCom',async ()=>{
          await that.insertDate.insertChapter(that.chapterPage.chapterData,true);
          if(that.chapterPage.hasChapter == 0){
            console.log('更新完成');
            console.log('===========');
            await that.chapterPage.closeBrowser();
          }else{
            console.log(that.chapterPage.startChapter+'到'+(that.chapterPage.startChapter+that.chapterPage.indexChapter)+'完成,总共有'+that.chapterPage.hasChapter+'章');
          }
          await that.chapterPage.cleanData();
          if(that.chapterPage.bookEnd == 1){
            that.indes++;
            if(that.indes <= that.hasBook){
              await that.chapterPage.closeBrowser();
              await that.main(that.bookArr[that.indes],that.indes);
            }else{
              await that.chapterPage.removeAllListeners('partCom')
              await that.chapterPage.closeBrowser();
              await that.insertDate.connentClose();
            }
          }else{
            await that.chapterPage.getCon();
          }
        });
        await that.chapterPage.getsouDate();
      })
    })
  }
}
(async ()=>{
  const ci = new upDateCon();
  await ci.main(ci.bookArr[0],0);
})()
