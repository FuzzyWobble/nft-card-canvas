class Card {

	//=========================================================================================================
	constructor(){

		this.group = new THREE.Group();
		this.debug = false; //true for logs
		this.updating = false;
		this.fov = 20;

		//-----------------------------------------------------------------------
		//gltf & model settings
		this.mesh;
		this.gltf_loader = new THREE.GLTFLoader();
		this.settings = {
			XrotateFactor:			0.5,
			YrotateFactor:			0.25,
			mx:						0,
        	my: 					0,
       		move_target:			new THREE.Vector3(0,0,0),
        	move_value:				new THREE.Vector3(0,0,0),
			lerp:					0.1,

			borderColor:			"#ffffff",
			borderRoughness:		0.5,
			borderTransmission: 	1,
			borderThickness:		0.33,
			borderClearCoat:		0,
			borderReflectivity:		0.5,

			cardRoughness:			1,
			cardMetalness:			0,

			infoDebug:				false,
		}

		this.tempPt = new THREE.Vector3();

		this.infoPoints = [
			{
				name:	'point1',
				div: 	document.getElementById('point1'),
				x:		0.24,
				y:		0.39,
				pt:		undefined,
			},
			{
				name:	'point2',
				div: 	document.getElementById('point2'),
				x:		0.88,
				y:		-0.62,
				pt:		undefined,
			},
			{
				name:	'point3',
				div: 	document.getElementById('point3'),
				x:		-0.62,
				y:		0.01,
				pt:		undefined,
			}
		]

		this.cardMat = new THREE.MeshPhysicalMaterial({
			color:			this.settings.borderColor,
			roughness: 		this.settings.borderRoughness,  
			transmission: 	this.settings.borderTransmission,
			thickness:		this.settings.borderThickness,
			clearcoat:		this.settings.borderClearCoat,
			reflectivity:	this.settings.borderReflectivity,
			side: 			THREE.DoubleSide
		}); //color: 'white', side: THREE.DoubleSide

		const loader = new THREE.TextureLoader();
		this.imageMat = new THREE.MeshStandardMaterial({ 
			map: loader.load('assets/image/card_test.jpg'),
		})

		this.infoMat = new THREE.MeshStandardMaterial({ color: 'coral', visible: this.settings.infoDebug });

		//-----------------------------------------------------------------------
		//setup
		this.gui_folder = _G.DATGUI.addFolder("CARD");
		this.gui_rotation = this.gui_folder.addFolder("ROTATION");
		this.gui_materials = this.gui_folder.addFolder("MATERIALS");
		this.gui_infoPts = this.gui_folder.addFolder("INFO PTS");
		// this.globalSetup();
		this.setup_gui();
		// this.init_interactions();
	}

	//=========================================================================================================
	init(_cb){ //called from init.js
		this.loadModel(()=>{
			this.init_interactions();
			this.updating = true;
			// this.setBackground();
			// _G.MYSCENE.scene.add(this.group);
			// _cb();
		});
	}

	init_infoPt(_parent, _i, _x, _y, _name){
		//card dims(x,y) -> (3.2,4.45)
		const geometry = new THREE.SphereGeometry( 0.1, 16, 32 );
		this.infoPoints[_i].pt = new THREE.Mesh(geometry, this.infoMat)
		this.infoPoints[_i].pt.position.x = _x * 3.2 / 2;
		this.infoPoints[_i].pt.position.y = _y * 4.45 / 2;
		// this.videoPlane.scale.set(this.settings.videoScale,this.settings.videoScale,this.settings.videoScale);
		_parent.add(this.infoPoints[_i].pt);

		let ptGui = this.gui_infoPts.addFolder(_name);
		ptGui.add(this.infoPoints[_i], "x", -1, 1, 0.01).onChange((val)=>{
			this.infoPoints[_i].pt.position.x = val * 3.2 / 2;
		})
		ptGui.add(this.infoPoints[_i], "y", -1, 1, 0.01).onChange((val)=>{
			this.infoPoints[_i].pt.position.y = val * 4.45 / 2;
		})
	}

	//=========================================================================================================
	init_interactions(){
		//add camera move code here
		window.onmousemove = (e) => {
			this.settings.mx = (e.clientX / window.innerWidth - 0.5) * 2;
			this.settings.my = (e.clientY / window.innerHeight - 0.5) * 2;

			this.settings.move_target.set(this.settings.mx,this.settings.my,0);
		}
	}

	//=========================================================================================================
	loadModel(_cb) {

		let _path = _G.ASSETS.card;
		//let group = new THREE.Group();
		this.gltf_loader.load(_path, (_gltf) => {
			this.mesh = _gltf.scene;
			// this.mesh.scale.set(this.scale, this.scale, this.scale);
			// this.mesh.rotation.y = Math.PI * 0.25;

			this.mesh.traverse((child) => {
				if (child.isMesh) {
					// child.castShadow = true;
					// child.receiveShadow = true;
					// child.frustumCulled = false;
					// child.material.metalness = 0;
					// console.log(child);
                    if (child.name.includes("card")){
                        console.log(child);
                        child.material = this.cardMat;
                    }
					if (child.name.includes("image")){
                        child.material = this.imageMat;
						child.material.map.flipY = false;
						console.log("card",child);

						this.infoPoints.forEach((pt, i)=>{
							this.init_infoPt(child, i, pt.x, pt.y, pt.name);
						})
						
                    }
				}
			});

			// this.group.add(this.mesh);
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

		})

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
		})
	}

	//--------------------------------------------------------------------------
	// setupMatGui(set, mat) {
	// 	let gui_temp = this.gui_water.addFolder(mat.name);
	// 	gui_temp.addColor(set, "color").onChange(() => {
	// 		// colorValue=colorValue.replace( '#','0x' );
	// 		mat.color.set(set.color);
	// 	});
	// 	gui_temp.add(mat, "roughness", 0.0, 1.0, 0.01);
	// 	gui_temp.add(mat, "metalness", 0.0, 1.0, 0.01);
	// }

}
