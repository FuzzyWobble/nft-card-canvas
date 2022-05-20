window.onload = ()=>{

	//-------------------------------------------
	_G.DATGUI = new dat.GUI({ autoPlace: false, width: 400 });
	var customContainer = document.getElementById("mygui");
	customContainer.appendChild(_G.DATGUI.domElement);
	_G.DATGUI.close();

	//-------------------------------------------
	_G.MYSCENE = new Scene(); //main scene and renderer
	_G.MYCARD = new Card();

	//-------------------------------------------
	//init sequence:
	_G.MYCARD.init();
	_G.MYSCENE.start(); //start renderer

	// _G.MYSCENE.test_scene();
	
};


