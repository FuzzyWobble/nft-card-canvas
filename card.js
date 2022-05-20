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
		}

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

		//-----------------------------------------------------------------------
		//setup
		this.gui_folder = _G.DATGUI.addFolder("CARD");
		this.gui_rotation = this.gui_folder.addFolder("ROTATION");
		this.gui_materials = this.gui_folder.addFolder("MATERIALS");
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

	//=========================================================================================================
	init_interactions(){
		//add camera move code here
		window.onmousemove = (e) => {
			this.settings.mx = (e.clientX / window.innerWidth - 0.5) * 2;
			this.settings.my = (e.clientY / window.innerHeight - 0.5) * 2;

			this.settings.move_target.set(this.settings.mx,this.settings.my,0);
			
			// console.log(x, y);
			// this.mesh.rotation.x = y * this.settings.YrotateFactor;
			// this.mesh.rotation.y = x * this.settings.XrotateFactor;
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
						console.log(child.material);
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
