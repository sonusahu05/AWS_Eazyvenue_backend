
const uuidv1 = require('uuid');


const uploadFile = function(base64Img,uploadFolder) {
    const base64ImgData = base64Img;   
    const fileType = base64ImgData.match(/[^:/]\w+(?=;|,)/)[0];            
    var imagefilename = uuidv1() + "."+fileType;
    var imagefilepicpath = uploadFolder + imagefilename;
    let filename;
    filename = __dirname + "/../../../" + imagefilepicpath;
    var base64Data;
    if(base64Img.indexOf("data:image/png;") !== -1) {
        base64Data = base64Img.replace(/^data:image\/png;base64,/, "");
    } else if(base64Img.indexOf("data:image/jpg;") !== -1) {
        base64Data = base64Img.replace(/^data:image\/jpg;base64,/, "");
    } else if(base64Img.indexOf("data:image/jpeg") !== -1) {
        base64Data = base64Img.replace(/^data:image\/jpeg;base64,/, "");
    }      
              
    if(typeof base64Data == 'undefined'){
        return false;
    } else if(base64Data != "") {
        require("fs").writeFile(filename, base64Data, 'base64', function(err) {
            console.log("File Upload Error: ", err);
        });
        return imagefilename;
    }
  }

module.exports ={
    uploadFile
}
