class Card {

	//=========================================================================================================
	constructor(_imgurl,_pts){

		this.imgurl = _imgurl;
		this.pts = _pts;

		this.group = new THREE.Group();
		this.debug = false; //true for logs
		this.updating = false;
		this.fov = 20;

		//-----------------------------------------------------------------------
		//gltf & model settings
		this.mesh;
		this.gltf_loader = new THREE.GLTFLoader();
		this.settings = {

			XrotateFactor:			0.75,
			YrotateFactor:			0.50,
			mx:						0,
        	my: 					0,
       		move_target:			new THREE.Vector3(0,0,0),
        	move_value:				new THREE.Vector3(0,0,0),
			lerp:					0.06,

			borderColor:			"#ffffff",
			borderRoughness:		0.5,
			borderMetalness: 		0,
			borderTransmission: 	1,
			borderThickness:		0.33,
			borderClearCoat:		0,
			borderReflectivity:		0.5,

			cardRoughness:			0.33,
			cardMetalness:			0,

			infoDebug:				false,
		}

		this.tempPt = new THREE.Vector3();

		this.infoPoints = [];
		for(var p=0;p<this.pts.length;p++){
			var n = 'point'+(p+1);
			this.infoPoints.push({
					name:	n,
					div: 	document.getElementById(n),
					x:		this.pts[p].x,
					y:		this.pts[p].y,
					pt:		undefined,
			});
		}

		this.cardMat = new THREE.MeshPhysicalMaterial({
			color:			this.settings.borderColor,
			roughness: 		this.settings.cardRoughness,  
			metalness: 		this.settings.cardMetalness,
			transmission: 	this.settings.borderTransmission,
			thickness:		this.settings.borderThickness,
			clearcoat:		this.settings.borderClearCoat,
			reflectivity:	this.settings.borderReflectivity,
			side: 			THREE.DoubleSide
		}); //color: 'white', side: THREE.DoubleSide

		const loader = new THREE.TextureLoader();
		this.imageMat = new THREE.MeshStandardMaterial({ 
			map: 			loader.load(this.imgurl),
			roughness: 		this.settings.cardRoughness,  
			metalness: 		this.settings.cardMetalness,
		})

		this.infoMat = new THREE.MeshStandardMaterial({ color: 'coral', visible: this.settings.infoDebug });

		//-----------------------------------------------------------------------
		//setup gui
		this.gui_folder = _G.DATGUI.addFolder("CARD");
		this.gui_rotation = this.gui_folder.addFolder("ROTATION");
		this.gui_materials = this.gui_folder.addFolder("MATERIALS");
		this.gui_infoPts = this.gui_folder.addFolder("INFO PTS");
		this.setup_gui();

	}

	//=========================================================================================================
	init(_cb){ //called from init.js
		this.loadModel(()=>{
			this.init_interactions();
			this.updating = true;
			this.mesh.position.y = -7;
			this.mesh.position.z = -3;
			_cb();
		});
	}

	//=========================================================================================================
	init_infoPt(_parent, _i, _x, _y, _name){
		//card dims(x,y) -> (3.2,3.2)
		const geometry = new THREE.SphereGeometry( 0.1, 16, 32 );
		this.infoPoints[_i].pt = new THREE.Mesh(geometry, this.infoMat)
		this.infoPoints[_i].pt.position.x = _x * 3.2 / 2;
		this.infoPoints[_i].pt.position.y = _y * 3.2 / 2;

		_parent.add(this.infoPoints[_i].pt);
		let ptGui = this.gui_infoPts.addFolder(_name);
		ptGui.add(this.infoPoints[_i], "x", -1, 1, 0.01).onChange((val)=>{
			this.infoPoints[_i].pt.position.x = val * 3.2 / 2;
		});
		ptGui.add(this.infoPoints[_i], "y", -1, 1, 0.01).onChange((val)=>{
			this.infoPoints[_i].pt.position.y = val * 3.2 / 2;
		});
	}

	//=========================================================================================================
	init_interactions(){
		
		console.log("phone???", _G.MYDETECT.is_mobile);
		if(!_G.MYDETECT.is_mobile){
			window.onmousemove = (e) => {
				this.settings.mx = (e.clientX / window.innerWidth - 0.5) * 2;
				this.settings.my = (e.clientY / window.innerHeight - 0.5) * 2;
				this.settings.move_target.set(this.settings.mx,this.settings.my,0);
			}
		} else if(typeof DeviceMotionEvent.requestPermission === 'function') {
			this.infoPoints[0].div.addEventListener('click', (e)=>{
				this.infoPoints[0].div.innerHTML = "clicked";
				DeviceOrientationEvent.requestPermission()
					.then(response => {
					if (response == 'granted') {
						let x_init = undefined;
						let y_init = undefined;
						window.addEventListener('deviceorientation', e => {
							if(!x_init){
								x_init = e.gamma;
								y_init = e.beta;
							}
							var x = e.gamma - x_init;  // In degree in the range [-180,180)
							var y = e.beta - y_init; // In degree in the range [-90,90)
							if (x >  30) { x =  30};
							if (x < -30) { x = -30};
							if (y >  30) { y =  30};
							if (y < -30) { y = -30};
							x /= -30;
							y /= -30;
				
							this.infoPoints[0].div.innerHTML = x_init;
							this.infoPoints[1].div.innerHTML = y_init;
							
				
							this.settings.move_target.set(x,y,0);
						});
					}
					})
			})
		}

		// function handleOrientation(event) {
			
		// 	output.textContent  = `beta : ${x}\n`;
		// 	output.textContent += `gamma: ${y}\n`;
		  
		// 	// Because we don't want to have the device upside down
		// 	// We constrain the x value to the range [-90,90]
			
		  
		// 	// To make computation easier we shift the range of
		// 	// x and y to [0,180]
			
		  
		// 	// 10 is half the size of the ball
		// 	// It center the positioning point to the center of the ball
		// 	ball.style.top  = (maxY*y/180 - 10) + "px";
		// 	ball.style.left = (maxX*x/180 - 10) + "px";
		//   }
		  
		  

	}

	//=========================================================================================================
	loadModel(_cb) {

		let _path = _G.ASSETS.card;

		if(_G.DEBUG){console.log("Loading model, "+_path);}

		this.gltf_loader.load(_path, (_gltf) => {

			if(_G.DEBUG){console.log("Model loaded");}

			this.mesh = _gltf.scene;
			// this.mesh.scale.set(this.scale, this.scale, this.scale);
			// this.mesh.rotation.y = Math.PI * 0.25;

			this.mesh.traverse((child) => {

				if(_G.DEBUG){console.log("Model child:");console.log(child);}

				if (child.isMesh) {

					// child.castShadow = true;
					// child.receiveShadow = true;
					// child.frustumCulled = false;

                    if(child.name.includes("card")){
                        child.material = this.cardMat;
                    }

					if(child.name.includes("image")){
                        child.material = this.imageMat;
						child.material.map.flipY = false;
						this.infoPoints.forEach((pt, i)=>{
							this.init_infoPt(child, i, pt.x, pt.y, pt.name);
						});
                    }

				}

			});

			_G.MYSCENE.scene.add(this.mesh);

			setTimeout(()=>{
				_cb();
			},500);

		});
	}

	//=========================================================================================================
	update() {

		if(!this.updating){return;}

		this.update_counter++;

		this.settings.move_value.lerp(this.settings.move_target,this.settings.lerp);
		this.mesh.rotation.x = this.settings.move_value.y * this.settings.YrotateFactor;
		this.mesh.rotation.y = this.settings.move_value.x * this.settings.XrotateFactor;

		this.infoPoints.forEach((pt, i)=>{

			pt.pt.getWorldPosition(this.tempPt);

			// map to normalized device coordinate (NDC) space
			this.tempPt.project( _G.MYSCENE.camera );

			// map to 2D screen space
			this.tempPt.x = Math.round( (   this.tempPt.x + 1 ) * _G.MYSCENE.container.width  / 2 );
			this.tempPt.y = Math.round( ( - this.tempPt.y + 1 ) * _G.MYSCENE.container.height / 2 );
			this.tempPt.z = 0;

			pt.div.style.top = this.tempPt.y - 25 + "px";
			pt.div.style.left = this.tempPt.x - 25 + "px";

		});

	}

	scrollAnimate(_scrollPercent){
		// console.log(this.mesh.position);
		this.mesh.position.y = Math.min((_scrollPercent - 30) * 0.1 - 7, 0);
		this.mesh.position.z = Math.min((_scrollPercent - 30) * 0.05 - 3, 0);
	}

	//=========================================================================================================
	setup_gui() {

		this.gui_rotation.add(this.settings, "XrotateFactor", 0, 1, 0.01);
		this.gui_rotation.add(this.settings, "YrotateFactor", 0, 1, 0.01);
		this.gui_rotation.add(this.settings, "lerp", 0, 1, 0.01);

		this.gui_materials.add(this.settings, "borderRoughness", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.roughness = val;
		});
		this.gui_materials.add(this.settings, "borderTransmission", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.transmission = val;
		});
		this.gui_materials.add(this.settings, "borderThickness", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.thickness = val;
		});
		this.gui_materials.add(this.settings, "borderClearCoat", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.clearcoat = val;
		});
		this.gui_materials.add(this.settings, "borderReflectivity", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.reflectivity = val;
		});
		this.gui_materials.add(this.settings, "cardRoughness", 0, 1, 0.01).onChange((val)=>{
			this.imageMat.roughness = val;
		});
		this.gui_materials.add(this.settings, "cardMetalness", 0, 1, 0.01).onChange((val)=>{
			this.imageMat.metalness = val;
		});
		this.gui_infoPts.add(this.settings, "infoDebug").onChange((val)=>{
			this.infoMat.visible = val;
		});

	}



}
