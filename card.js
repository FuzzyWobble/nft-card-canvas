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
			XrotateFactor:		0.5,
			YrotateFactor:		0.25,

			cardColor:			"#ffffff",
			cardRoughness:		0.5,
			cardTransmission: 	1,
			cardThickness:		0.33,
			cardClearCoat:		0,
			cardReflectivity:	0.5,
		}
		this.cardMat = new THREE.MeshPhysicalMaterial({
			color:			this.settings.cardColor,
			roughness: 		this.settings.cardRoughness,  
			transmission: 	this.settings.cardTransmission,
			thickness:		this.settings.cardThickness,
			clearcoat:		this.settings.cardClearCoat,
			reflectivity:	this.settings.cardReflectivity,
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
			// this.setBackground();
			// _G.MYSCENE.scene.add(this.group);
			// _cb();
		});
	}

	//=========================================================================================================
	init_interactions(){
		//add camera move code here
		window.onmousemove = (e) => {
			let x = (e.clientX / window.innerWidth - 0.5) * 2;
			let y = (e.clientY / window.innerHeight - 0.5) * 2;
			// console.log(x, y);
			this.mesh.rotation.x = y * this.settings.YrotateFactor;
			this.mesh.rotation.y = x * this.settings.XrotateFactor;
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

	}

	//=========================================================================================================
	setup_gui() {
		this.gui_rotation.add(this.settings, "XrotateFactor", 0, 1, 0.01);
		this.gui_rotation.add(this.settings, "YrotateFactor", 0, 1, 0.01);

		this.gui_materials.add(this.settings, "cardRoughness", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.roughness = val;
		});
		this.gui_materials.add(this.settings, "cardTransmission", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.transmission = val;
		});
		this.gui_materials.add(this.settings, "cardThickness", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.thickness = val;
		});
		this.gui_materials.add(this.settings, "cardClearCoat", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.clearcoat = val;
		});
		this.gui_materials.add(this.settings, "cardReflectivity", 0, 1, 0.01).onChange((val)=>{
			this.cardMat.reflectivity = val;
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
