//=========================================================================================================
window.onload = ()=>{

	create_card_scene(
		"assets/image/card_test2.jpg",
		"assets/video/bg_test2.mp4",
		[{x:0.24,y:0.39},{x:0.88,y:-0.62},{x:-0.62,y:0.01}]
	);

};

//=========================================================================================================
function create_card_scene(_img,_vid,_pts){

	var pts_html = '';
	for(var p=0;p<_pts.length;p++){
		var idx = p+1;
		pts_html += '<div id="point'+idx+'" class="points">Test</div>';
	}
	var html = `
		<div id="mygui"></div> 
		<canvas id="mycanvas"></canvas> 
		<div id="canvasbg"></div> 
		`+pts_html+`
	`;
	document.getElementById("mythree").innerHTML = html;

	_G.MYDETECT = new MyDetect();
	_G.MYSCENE = new Scene(_vid); //main scene and renderer
	_G.MYCARD = new Card(_img,_pts);

	_G.MYCARD.init(()=>{ //callback after card loads
		if(_G.DEBUG){console.log("Initialize complete, starting renderer.");}
		_G.MYSCENE.start(); //start renderer
		var loading = document.getElementById("loading");
		loading.style.display = "none";
	});
	
}


