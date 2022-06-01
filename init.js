//=========================================================================================================
window.onload = ()=>{

	// document.body.scrollTo(0,0); //always start at top

	create_card_scene(
		"assets/image/card_test2.jpg",
		{
			path:		"assets/light_explode/",
			name:		"light-explode-low-res0",
			fileType:	".jpg",
			startFrame:	155,
			numFrames:	60
		},
		// "assets/video/bg_test2.mp4",
		[{x:0.24,y:0.39},{x:0.88,y:-0.62},{x:-0.62,y:0.01}]
	);

};

//=========================================================================================================
function create_card_scene(_img,_imgSeq,_pts){

	var pts_html = '';
	for(var p=0;p<_pts.length;p++){
		var idx = p+1;
		pts_html += '<div id="point'+idx+'" class="points"></div>';
	}
	var html = `
		<div id="mygui"></div> 
		<canvas id="mycanvas"></canvas> 
		<div id="canvasbg"></div> 
		`+pts_html+`
	`;
	document.getElementById("mythree").innerHTML = html;

	_G.MYDETECT = new MyDetect();
	_G.MYSCENE = new Scene(_imgSeq ); //main scene and renderer
	_G.MYCARD = new Card(_img,_pts);

	_G.MYCARD.init(()=>{ //callback after card loads
		if(_G.DEBUG){console.log("Initialize complete, starting renderer.");}
		_G.MYSCENE.start(); //start renderer
		var loading = document.getElementById("loading");
		loading.style.display = "none";
	});

	document.body.onscroll = () => {
		//calculate the current scroll progress as a percentage
		scrollPercent =
			((document.documentElement.scrollTop || document.body.scrollTop) /
				((document.documentElement.scrollHeight ||
					document.body.scrollHeight) -
					document.documentElement.clientHeight)) * 100;
		if(_G.MYSCENE.vtex[0].vtexture){
			_G.MYSCENE.vtex[0].vtexture.scroll(scrollPercent * 2);
		}
		if(scrollPercent>30){
			_G.MYCARD.scrollAnimate(scrollPercent);
			if(scrollPercent<40){
				_G.MYSCENE.blurMat.roughness = (scrollPercent - 30) / 40;
				_G.MYSCENE.blurMat.reflectivity = (scrollPercent - 30) / 20;
			} else {
				_G.MYSCENE.blurMat.roughness = 0.25;
				_G.MYSCENE.blurMat.reflectivity = 0.5;
			}
		}
		else{
			_G.MYCARD.scrollAnimate(0);
			_G.MYSCENE.blurMat.roughness = 0;
			_G.MYSCENE.blurMat.reflectivity = 0;
		}
		document.getElementById('scrollProgress').innerText =
			'Scroll Progress : ' + scrollPercent.toFixed(2)
	}
	
}


