Kropr = {};

/* -------- */
/* Settings */
/* -------- */

Kropr.settings = {};
Kropr.settings.upload_id = 'uploader';
Kropr.settings.container_id = 'image_container';
Kropr.settings.results_id = 'crop_result';

Kropr.settings.debug = true;


/* --------------- */
/* Kropr Functions */
/* --------------- */


//init the app
Kropr.init = function () {

    Kropr.resetProperties();
    //add event listeners
    Kropr.bindListeners();

}

//reset everything
Kropr.resetProperties = function () {

    //instantiate properties
    Kropr.canvas = null;
    Kropr.ctx = null;
    Kropr.image = null;
    Kropr.iMouseX = 1;
    Kropr.iMouseY = 1;
    Kropr.theSelection = null;

    $("#" + Kropr.settings.results_id).fadeOut(300);

}

//when a file is uploaded
Kropr.fileUploaded = function (id) {

    //give it a clean slate
    Kropr.resetProperties();

    //fade in preview container
    $("#" + Kropr.settings.container_id).fadeIn(300);

    //get user selected file
    var file = document.getElementById(id).files[0];
    var filter = /^(image\/bmp|image\/gif|image\/jpeg|image\/png|image\/tiff)$/i;

    //ensure file format is acceptable
    if (!filter.test(file.type)) {
        //add error
        return;
    }

    //init file reader
    var reader = new FileReader();

    //when the file reader is ready
    reader.onload = function (e) {

        //init image
        Kropr.image = new Image();
        Kropr.image.src = e.target.result;

        //when the image is loaded
        Kropr.image.onload = function () {

            //console log information about the image if debug is set to true
            if (Kropr.settings.debug) {
                console.log('Name: ' + file.name);
                console.log('Type: ' + file.type);
                console.log('Width: ' + Kropr.image.naturalWidth);
                console.log('Height: ' + Kropr.image.naturalHeight);
                console.log('Filesize: ' + Kropr.bytesToSize(file.size));
            }

            //create the canvas
            $("#" + Kropr.settings.container_id).html('<canvas width="' + Kropr.image.naturalWidth + '" height="' + Kropr.image.naturalHeight + '" id="kropr_preview" /> ')
            //create the crop button
            $("#" + Kropr.settings.container_id).append('<a href="#" id="kropr_complete" >Crop</a>');

            //get the canvas ready to edit
            Kropr.canvas = document.getElementById('kropr_preview');
            Kropr.ctx = Kropr.canvas.getContext('2d');

            Kropr.bindLateListeners();

            //clear the canvas
            Kropr.ctx.clearRect(0, 0, Kropr.ctx.canvas.width, Kropr.ctx.canvas.height);

            //setup the image on the canvas
            Kropr.ctx.drawImage(Kropr.image, 0, 0, Kropr.ctx.canvas.width, Kropr.ctx.canvas.height);

            //setup the overlay
            Kropr.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            Kropr.ctx.fillRect(0, 0, Kropr.ctx.canvas.width, Kropr.ctx.canvas.height);

            //setup the initial selection
            Kropr.theSelection = new Kropr.Selection(15, 15, Kropr.ctx.canvas.width - 30, Kropr.ctx.canvas.height - 30);

            //draw the canvas instance
            Kropr.theSelection.draw();

        }
    }

    //load the file into the file reader (will call the above "reader.onload()" when ready)
    reader.readAsDataURL(file);

}

//draw the canvas
Kropr.drawScene = function () {

    Kropr.ctx.clearRect(0, 0, Kropr.ctx.canvas.width, Kropr.ctx.canvas.height); // clear canvas

    // draw source image
    Kropr.ctx.drawImage(Kropr.image, 0, 0, Kropr.ctx.canvas.width, Kropr.ctx.canvas.height);

    // and make it darker
    Kropr.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    Kropr.ctx.fillRect(0, 0, Kropr.ctx.canvas.width, Kropr.ctx.canvas.height);

    // draw selection
    Kropr.theSelection.draw();
}

//crop the image / show the results
Kropr.getResults = function () {

    //create temp variables
    var temp_ctx, temp_canvas;

    //setup temp canvas 
    temp_canvas = document.createElement('canvas');
    temp_ctx = temp_canvas.getContext('2d');
    temp_canvas.width = Kropr.theSelection.w;
    temp_canvas.height = Kropr.theSelection.h;
    temp_ctx.drawImage(Kropr.image, Kropr.theSelection.x, Kropr.theSelection.y, Kropr.theSelection.w, Kropr.theSelection.h, 0, 0, Kropr.theSelection.w, Kropr.theSelection.h);

    //get image data
    var vData = temp_canvas.toDataURL();

    //set results image with date
    $("#" + Kropr.settings.results_id).attr('src', vData);
    $("#" + Kropr.settings.results_id).show(300);
    $("#" + Kropr.settings.container_id).hide(300);

}

//bind listeners
Kropr.bindListeners = function () {

    //When a file is selected
    $("#" + Kropr.settings.upload_id).change(function () {

        Kropr.fileUploaded(Kropr.settings.upload_id);

    });

}

//bind listeners to objects added later
Kropr.bindLateListeners = function () {

    //when mouse moves
    $('#kropr_preview').mousemove(function (e) { // binding mouse move event

        var canvasOffset = $("#kropr_preview").offset();

        Kropr.iMouseX = Math.floor(e.pageX - canvasOffset.left);
        Kropr.iMouseY = Math.floor(e.pageY - canvasOffset.top);

        // in case of drag of whole selector
        if (Kropr.theSelection.bDragAll) {
            Kropr.theSelection.x = Kropr.iMouseX - Kropr.theSelection.px;
            Kropr.theSelection.y = Kropr.iMouseY - Kropr.theSelection.py;
        }

        for (i = 0; i < 4; i++) {
            Kropr.theSelection.bHow[i] = false;
            Kropr.theSelection.iCSize[i] = Kropr.theSelection.csize;
        }

        // hovering over resize cubes
        if (Kropr.iMouseX > Kropr.theSelection.x - Kropr.theSelection.csizeh && Kropr.iMouseX < Kropr.theSelection.x + Kropr.theSelection.csizeh && Kropr.iMouseY > Kropr.theSelection.y - Kropr.theSelection.csizeh && Kropr.iMouseY < Kropr.theSelection.y + Kropr.theSelection.csizeh) {

            Kropr.theSelection.bHow[0] = true;
            Kropr.theSelection.iCSize[0] = Kropr.theSelection.csizeh;
        }
        if (Kropr.iMouseX > Kropr.theSelection.x + Kropr.theSelection.w - Kropr.theSelection.csizeh && Kropr.iMouseX < Kropr.theSelection.x + Kropr.theSelection.w + Kropr.theSelection.csizeh && Kropr.iMouseY > Kropr.theSelection.y - Kropr.theSelection.csizeh && Kropr.iMouseY < Kropr.theSelection.y + Kropr.theSelection.csizeh) {

            Kropr.theSelection.bHow[1] = true;
            Kropr.theSelection.iCSize[1] = Kropr.theSelection.csizeh;
        }
        if (Kropr.iMouseX > Kropr.theSelection.x + Kropr.theSelection.w - Kropr.theSelection.csizeh && Kropr.iMouseX < Kropr.theSelection.x + Kropr.theSelection.w + Kropr.theSelection.csizeh && Kropr.iMouseY > Kropr.theSelection.y + Kropr.theSelection.h - Kropr.theSelection.csizeh && Kropr.iMouseY < Kropr.theSelection.y + Kropr.theSelection.h + Kropr.theSelection.csizeh) {

            Kropr.theSelection.bHow[2] = true;
            Kropr.theSelection.iCSize[2] = Kropr.theSelection.csizeh;
        }
        if (Kropr.iMouseX > Kropr.theSelection.x - Kropr.theSelection.csizeh && Kropr.iMouseX < Kropr.theSelection.x + Kropr.theSelection.csizeh && Kropr.iMouseY > Kropr.theSelection.y + Kropr.theSelection.h - Kropr.theSelection.csizeh && Kropr.iMouseY < Kropr.theSelection.y + Kropr.theSelection.h + Kropr.theSelection.csizeh) {

            Kropr.theSelection.bHow[3] = true;
            Kropr.theSelection.iCSize[3] = Kropr.theSelection.csizeh;
        }

        // in case of dragging of resize cubes
        var iFW, iFH;
        if (Kropr.theSelection.bDrag[0]) {
            var iFX = Kropr.iMouseX - Kropr.theSelection.px;
            var iFY = Kropr.iMouseY - Kropr.theSelection.py;
            iFW = Kropr.theSelection.w + Kropr.theSelection.x - iFX;
            iFH = Kropr.theSelection.h + Kropr.theSelection.y - iFY;
        }
        if (Kropr.theSelection.bDrag[1]) {
            var iFX = Kropr.theSelection.x;
            var iFY = Kropr.iMouseY - Kropr.theSelection.py;
            iFW = Kropr.iMouseX - Kropr.theSelection.px - iFX;
            iFH = Kropr.theSelection.h + Kropr.theSelection.y - iFY;
        }
        if (Kropr.theSelection.bDrag[2]) {
            var iFX = Kropr.theSelection.x;
            var iFY = Kropr.theSelection.y;
            iFW = Kropr.iMouseX - Kropr.theSelection.px - iFX;
            iFH = Kropr.iMouseY - Kropr.theSelection.py - iFY;
        }
        if (Kropr.theSelection.bDrag[3]) {
            var iFX = Kropr.iMouseX - Kropr.theSelection.px;
            var iFY = Kropr.theSelection.y;
            iFW = Kropr.theSelection.w + Kropr.theSelection.x - iFX;
            iFH = Kropr.iMouseY - Kropr.theSelection.py - iFY;
        }

        if (iFW > Kropr.theSelection.csizeh * 2 && iFH > Kropr.theSelection.csizeh * 2) {
            Kropr.theSelection.w = iFW;
            Kropr.theSelection.h = iFH;

            Kropr.theSelection.x = iFX;
            Kropr.theSelection.y = iFY;
        }

        Kropr.drawScene();
    });


    //when mouse goes down
    $('#kropr_preview').mousedown(function (e) {

        var canvasOffset = $("#kropr_preview").offset();
        Kropr.iMouseX = Math.floor(e.pageX - canvasOffset.left);
        Kropr.iMouseY = Math.floor(e.pageY - canvasOffset.top);

        Kropr.theSelection.px = Kropr.iMouseX - Kropr.theSelection.x;
        Kropr.theSelection.py = Kropr.iMouseY - Kropr.theSelection.y;

        if (Kropr.theSelection.bHow[0]) {
            Kropr.theSelection.px = Kropr.iMouseX - Kropr.theSelection.x;
            Kropr.theSelection.py = Kropr.iMouseY - Kropr.theSelection.y;
        }
        if (Kropr.theSelection.bHow[1]) {
            Kropr.theSelection.px = Kropr.iMouseX - Kropr.theSelection.x - Kropr.theSelection.w;
            Kropr.theSelection.py = Kropr.iMouseY - Kropr.theSelection.y;
        }
        if (Kropr.theSelection.bHow[2]) {
            Kropr.theSelection.px = Kropr.iMouseX - Kropr.theSelection.x - Kropr.theSelection.w;
            Kropr.theSelection.py = Kropr.iMouseY - Kropr.theSelection.y - Kropr.theSelection.h;
        }
        if (Kropr.theSelection.bHow[3]) {
            Kropr.theSelection.px = Kropr.iMouseX - Kropr.theSelection.x;
            Kropr.theSelection.py = Kropr.iMouseY - Kropr.theSelection.y - Kropr.theSelection.h;
        }

        if (Kropr.iMouseX > Kropr.theSelection.x + Kropr.theSelection.csizeh && Kropr.iMouseX < Kropr.theSelection.x + Kropr.theSelection.w - Kropr.theSelection.csizeh && Kropr.iMouseY > Kropr.theSelection.y + Kropr.theSelection.csizeh && Kropr.iMouseY < Kropr.theSelection.y + Kropr.theSelection.h - Kropr.theSelection.csizeh) {

            Kropr.theSelection.bDragAll = true;
        }

        for (i = 0; i < 4; i++) {
            if (Kropr.theSelection.bHow[i]) {
                Kropr.theSelection.bDrag[i] = true;
            }
        }
    });

    //when mouse is released
    $('#kropr_preview').mouseup(function (e) { // binding mouseup event

        Kropr.theSelection.bDragAll = false;

        for (i = 0; i < 4; i++) {
            Kropr.theSelection.bDrag[i] = false;
        }
        Kropr.theSelection.px = 0;
        Kropr.theSelection.py = 0;
    });


    //when crop button is clicked
    $("#kropr_complete").click(function () {
        Kropr.getResults();
    });


}


/* ------- */
/* Classes */
/* ------- */

/*  Selection Class */

Kropr.Selection = function (x, y, w, h) {
    this.x = x; // initial positions
    this.y = y;
    this.w = w; // and size
    this.h = h;

    this.px = x; // extra variables to dragging calculations
    this.py = y;

    this.csize = 6; // resize cubes size
    this.csizeh = 10; // resize cubes size (on hover)

    this.bHow = [false, false, false, false]; // hover statuses
    this.iCSize = [this.csize, this.csize, this.csize, this.csize]; // resize cubes sizes
    this.bDrag = [false, false, false, false]; // drag statuses
    this.bDragAll = false; // drag whole selection
}

Kropr.Selection.prototype.draw = function () {

    Kropr.ctx.strokeStyle = '#000';
    Kropr.ctx.lineWidth = 2;
    Kropr.ctx.strokeRect(this.x, this.y, this.w, this.h);

    // draw part of original image
    if (this.w > 0 && this.h > 0) {
        Kropr.ctx.drawImage(Kropr.image, this.x, this.y, this.w, this.h, this.x, this.y, this.w, this.h);
    }

    // draw resize cubes
    Kropr.ctx.fillStyle = '#fff';
    Kropr.ctx.fillRect(this.x - this.iCSize[0], this.y - this.iCSize[0], this.iCSize[0] * 2, this.iCSize[0] * 2);
    Kropr.ctx.fillRect(this.x + this.w - this.iCSize[1], this.y - this.iCSize[1], this.iCSize[1] * 2, this.iCSize[1] * 2);
    Kropr.ctx.fillRect(this.x + this.w - this.iCSize[2], this.y + this.h - this.iCSize[2], this.iCSize[2] * 2, this.iCSize[2] * 2);
    Kropr.ctx.fillRect(this.x - this.iCSize[3], this.y + this.h - this.iCSize[3], this.iCSize[3] * 2, this.iCSize[3] * 2);
}



/* ---------------- */
/* Utility Function */
/* ---------------- */

Kropr.bytesToSize = function (bytes) {
    var sizes = ['Bytes', 'KB', 'MB'];
    if (bytes == 0) return 'n/a';

    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}



/* ---------- */
/* Dom Loaded */
/* ---------- */

$(document).ready(function () {

    Kropr.init();

});