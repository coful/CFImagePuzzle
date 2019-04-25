$().ready(function() {
    $("#pic").change(function() {
        if (this.files.length > 0) {
            if (this.files[0].type == "image/jpeg" || this.files[0].type == "image/png") {
                reader.readAsDataURL(this.files[0]);
            } else {
                $(this).val("");
            }
        } else {
            $(this).val("");
        }
    });

    $('input[type=radio][name=mode]').change(function() {
        if (this.id == 'encrypt') {
            $('#inputKey').hide();
        } else if (this.id == 'decrypt') {
            $('#inputKey').show();
            $('#key').val("");
            $("#pic").val("");
            clearCanvas("canvasImg");
            clearCanvas("canvasObj");
        }
    });

    var reader = new FileReader();
    reader.onload = function(evt) {
        var imageUrl = evt.target.result;
        $("#canvasObj").Puzzle(imageUrl);
    }
});

function clearCanvas(ID)  
{  
    var c=document.getElementById(ID);  
    var cxt=c.getContext("2d");  
    cxt.clearRect(0,0,c.width,c.height);  
} 

//字节数组转字符串
function Bytes2String(arrBytes) {
    var str = "";
    for (var i = 0; i < arrBytes.length; i++) {
        var tmp;
        var num = parseInt(arrBytes[i]);

        if (num < 10) { //0~9
            tmp = String.fromCharCode(48 + num);
        } else if (num >= 10 && num < 36) { //A~Z
            tmp = String.fromCharCode(55 + num);
        } else if (num >= 36 && num < 62) { //a~z
            tmp = String.fromCharCode(61 + num);
        } else { //#~$
            tmp = String.fromCharCode(num - 27);
        }
        str += tmp;
    }
    return str;
}

//字符串转字节数组
function StringBytes(keyStr) {
    var array = [];
    for (var i = 0; i < keyStr.length; i++) {
        var tmp;
        var num = keyStr.charCodeAt(i);

        if (num >= 48 && num < 58) { //0~9
            tmp = num - 48;
        } else if (num >= 65 && num <= 90) { //A~Z
            tmp = num - 55;
        } else if (num >= 97 && num <= 122) { //a~z
            tmp = num - 61;
        } else { //#~$
            tmp = num + 27;
        }
        array.push(tmp);
    }
    return array;
}

$.fn.Puzzle = function(imagePath) {
    var canvasObj = this;
    var context = $(this)[0].getContext("2d");
    var pieces = [];
    var drawPoints = [];
    var keyArray = [];
    var xCount = 8;
    var yCount = 8;
    var pieceWidth = 0;
    var pieceHeight = 0;
    var newImg;

    var startDraw = function() { //开始
        pieceWidth = canvasObj.width() / xCount;
        pieceHeight = canvasObj.height() / yCount;

        console.log(pieceWidth);
        console.log(pieceHeight);

        for (var y = 0; y < yCount; y++) {
            for (var x = 0; x < xCount; x++) {
                pieces.push({
                    index: x + y,
                    point: {
                        x: x * pieceWidth,
                        y: y * pieceHeight,
                        width: pieceWidth,
                        height: pieceHeight
                    }
                });
                drawPoints.push({
                    x: x * pieceWidth,
                    y: y * pieceHeight
                });
            }
        }

        var count = pieces.length;

        if ($("#decrypt").is(":checked")) { //复原
            var keyStr = $('#key').val(); //key
            keyArray = StringBytes(keyStr);
            keyArray = getReverseArray(keyArray); //利用反转数组复原
            //console.log(keyArray);
        } else { //乱序
            keyArray = getRandomArray(pieces.length); //利用随机数组乱序
            //console.log(keyArray);
            var keyStr = Bytes2String(keyArray);
            console.log(keyStr);
            $('#inputKey').show();
            $('#key').val(keyStr)
        }

        for (var i = 0; i < count; i++) {
            var index = keyArray[i];
            var drawPoint = drawPoints[index];
            pieces[i].DrawPoint = drawPoint;
        }

        draw();
    }

    var getReverseArray = function(array) { //生成反转数组
        var reverseArray = [];
        for (var i = 0; i < array.length; i++) {
            var index = array[i];
            reverseArray[index] = i;
        }
        return reverseArray;
    }

    var getRandomArray = function(num) { //生成随机数组
        var randomArray = [];
        for (var i = 0; i < num; i++) {
            randomArray.push(i);
        }
        shuffle(randomArray);
        return randomArray;
    }

    var shuffle = function(a) { //乱序
        var len = a.length;
        for (var i = 0; i < len - 1; i++) {
            var index = parseInt(Math.random() * (len - i));
            var temp = a[index];
            a[index] = a[len - i - 1];
            a[len - i - 1] = temp;
        }
    }

    var draw = function() { //画
        context.clearRect(0, 0, canvasObj.width(), canvasObj.height());
        for (var i = 0; i < pieces.length; i++) {
            drawPiece(pieces[i]);
        }
    };

    var drawPiece = function(piece) { //画一块块
        var x = piece.point.x;
        var y = piece.point.y;
        var width = piece.point.width;
        var height = piece.point.height;
        //console.log(x);
        //console.log(y);
        var drawX = piece.DrawPoint.x;
        var drawY = piece.DrawPoint.y;
        //console.log(drawX);
        //console.log(drawY);
        var canvas = document.getElementById('canvasImg');
        //从调整尺寸后的canvas画
        context.drawImage(canvas, x, y, width, height, drawX, drawY, pieceWidth, pieceHeight);
    }

    function image2Canvas(image) { //图片转canvas，重画图片，调整尺寸
        //console.log("image2Canvas");
        var canvas = document.getElementById('canvasImg');
        var OriginW = image.width;
        var OriginH = image.height;

        var width = Math.round(OriginW / xCount) * xCount;
        var height = Math.round(OriginH / yCount) * yCount;
        canvas.width = width;
        canvas.height = height;

        canvasObj.attr('width', width);
        canvasObj.attr('height', height);

        //重画图片
        canvas.getContext("2d").drawImage(image, 0, 0, OriginW, OriginH, 0, 0, width, height);
    }

    function canvas2Image() { //canvas转图片，方便保存
        //console.log("canvas2Image");
        var image = new Image();
        var canvas = document.getElementById('canvasObj');
        image.src = canvas.toDataURL("image/jpeg");

        return image;
    }

    var img = $(new Image());
    img.load(function(e) { //加载图片
        image2Canvas(img[0]);
        startDraw();
        //$("#pngHolder").append(canvas2Image());
    });
    img.attr("src", imagePath);

};