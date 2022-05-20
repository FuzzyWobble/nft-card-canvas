class Scene {

	//=========================================================================================================
	constructor() {

		//-----------------------------------------------------------------------
		//vars
		this.running = false; //set to true once start()
		this.dt = 0;
		this.w = window.innerWidth;
		this.h = window.innerHeight;
		this.debug = false; //turn true for logs
		this.has_controls = false;
		this.renderer;
		this.hdr_loader = new THREE.RGBELoader();

		//-----------------------------------------------------------------------
		//settings changed with datgui
		this.encoding_settings = {
			Linear: THREE.LinearEncoding, 
			SRGB: 	THREE.sRGBEncoding, 
			Depth: 	THREE.BasicDepthPacking,
			RGBA: 	THREE.RGBADepthPacking
		},
		this.settings = {
			//scene
			videoScale:					1.1,
			background:					false,
			background_color: 			"#ffffff",
			background_opacity:			1,
			fog_near: 					15,
			fog_depth: 					50,
			exposure: 					0.9,
			encoding: THREE.sRGBEncoding,
			hdr: "ThreeSoftboxesStudio2.hdr",
			envs: [
				"None",
				"BasicStudio.hdr",
				"OverheadDotsAndFloorStudio.hdr",
				"BasicStudio2.hdr",
				"OverheadDotsStudio.hdr",
				"BasicStudio3.hdr",
				"RingLightAndSoftboxesStudio.hdr",
				"BevelReflection.hdr",
				"RingStudio.hdr",
				"BlueWashStudio.hdr",
				"SoftLightsStudio1.hdr",
				"ColorSoftboxStudio.hdr",
				"SoftLightsStudio2.hdr",
				"DivaStudio.hdr",
				"SpotsandUmbrellaStudio.hdr",
				"GradSoftStudio.hdr",
				"Studio4.hdr",
				"GreyStudio.hdr",
				"ThreeSoftboxesStudio1.hdr",
				"KinoStudio.hdr",
				"ThreeSoftboxesStudio2.hdr",
				"KinoStudio2.hdr",
				"TotaStudio.hdr",
			],

			//lights
			hlight_visible:				true, //hemisphere light
			hlight_intensity: 			1.0,
			hlight_color: 				0xffffff,
			hlight_ground_color: 		0xaaaaaa,

			dlight_visible:				true, //directional light
			dlight_color: 				0xffffff,
			dlight_intensity: 			0.5,
			dlight_x: 					1.09,
			dlight_y: 					6.23,
			dlight_z: 					9.6,

			//camera
			fov: 						50,
			camera_initial_position: 	{ x: 0, y: 0, z: 7.5},
			near: 						0.02,
			far: 						100
		};

		this.setup_scene();

		this.gui_scene = _G.DATGUI.addFolder("SCENE");
		this.gui_lights = _G.DATGUI.addFolder("LIGHTS");
		this.gui_camera = _G.DATGUI.addFolder("CAMERA");
		this.setup_gui();

	}

	//=========================================================================================================
	setup_scene(){

		//-----------------------------------------------------------------------
		//Renderer
		this.scene = new THREE.Scene();
		this.container = document.getElementById("mycanvas");
		this.renderer = new THREE.WebGLRenderer({ canvas:this.container, antialias:true, alpha:true });
		this.renderer.setSize(this.w, this.h);
		this.renderer.setClearColor(this.settings.background_color, this.settings.background_opacity);
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		//this.renderer.physicallyCorrectLights = true;
		//this.renderer.shadowIntensity = 1;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		//-----------------------------------------------------------------------
		//Camera
		this.camera = new THREE.PerspectiveCamera( this.settings.fov, window.innerWidth / window.innerHeight, this.settings.near, this.settings.far );
		this.camera.position.set(
			this.settings.camera_initial_position.x,
			this.settings.camera_initial_position.y,
			this.settings.camera_initial_position.z
		);
		this.camera.aspect = this.w / this.h;
		this.camera.updateProjectionMatrix();
		this.scene.add(this.camera);

		//-----------------------------------------------------------------------
		//Lights
		this.scene.fog = new THREE.Fog(
			this.settings.background_color,
			this.settings.fog_near,
			this.settings.fog_near + this.settings.fog_depth
		);
		this.dlight = new THREE.DirectionalLight();
		this.dlight.visible = this.settings.dlight_visible;
		this.dlight.intensity = this.settings.dlight_intensity;
		this.dlight.position.set(this.settings.dlight_x, this.settings.dlight_y, this.settings.dlight_z);
		this.dlight.castShadow = this.dlight_shadows;
		this.dlight.shadow.mapSize.width = this.dlight_shadow_size;
		this.dlight.shadow.mapSize.height = this.dlight_shadow_size;
		this.dlight.shadow.camera.near = 0.01;
		this.dlight.shadow.camera.far = 100;
		this.dlight.shadow.camera.fov = 30;
		this.dlight.shadow.camera.left = -50;
		this.dlight.shadow.camera.bottom = -50;
		this.dlight.shadow.camera.top = 50;
		this.dlight.shadow.camera.right = 50;
		this.scene.add(this.dlight);

		this.hlight = new THREE.HemisphereLight(0xeeeeee, 0xaaaaaa, this.settings.hlight_intensity);
		this.hlight.visible = this.settings.hlight_visible;
		this.scene.add(this.hlight);

		if (this.has_controls) {
			this.controls = new THREE.OrbitControls(this.camera, this.container);
			this.controls.enabled = _G.ALLOW_MOUSE_CONTROL_CAM;
			this.controls.screenSpacePanning = true;
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 0.05;
			this.controls.rotateSpeed = 1.0;
			this.controls.zoomSpeed = 1;
			this.controls.target.set(0, 0.45, 0);
			this.controls.addEventListener("change", (c) => {
				//controls event
				//you can check things here
			});
		}

		const geometry = new THREE.PlaneGeometry( 16, 9 );
		const material = new THREE.MeshNormalMaterial();
		this.videoPlane = new THREE.Mesh(geometry, material)
		this.videoPlane.position.z = -2;
		this.videoPlane.scale.set(this.settings.videoScale,this.settings.videoScale,this.settings.videoScale);
		this.scene.add(this.videoPlane);

		this.vidTexture(this.videoPlane);

		window.addEventListener("resize",()=>{
			this.size_canvas();
		},false);
		this.size_canvas();

		this.set_hdr();
	}

	//=========================================================================================================
	size_canvas(){
		this.w = Math.ceil( window.innerWidth );
		this.h = Math.ceil( window.innerHeight );
		this.camera.aspect = this.w / this.h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.w, this.h);
		// $("#mycanvas").css("width", window.innerWidth + "px").css("height", window.innerHeight + "px"); //stretch it!
	}

	//=========================================================================================================
	vidTexture(_child){
		this.vtex = [
			{
				vtexture: undefined,
				vmat: new THREE.MeshBasicMaterial({
					color: 0xffffff,
					// roughness: 0.95,metalness: 0.05,
				}),
				uid: "billboard_world1_1",
				url: "assets/video/bg_test.mp4",
				mesh_name: "vtex_billboard1",
				mesh: undefined,
				three: _G.MYSCENE,
				resolution: { x: 1920, y: 1080 },
				offset: { x: 0, y: 0 },
				repeat: { x: 1, y: 1 },
				animation: { x: 0, y: 0 },
				rotation: 0,
				threshold: 20,
				audio: false,
				muted: true,
			}
		]
		
		console.log("Setting vtexture, " + this.vtex[0].mesh_name + "...");
		this.vtex[0].mesh = _child;
		this.vtex[0].mesh.material = this.vtex[0].vmat;
		this.vtex[0].vtexture = new VideoTexture(this.vtex[0]);
		this.vtex[0].vtexture.init(()=>{
			console.log("Complete setting up vtexture");
			this.vtex[0].vtexture.start();
		});
	}

	//=========================================================================================================
	render(){

		if(!this.running){return;}
		this.update_counter++;

		if(_G.MYCARD) {
			_G.MYCARD.update();
		}

		if(this.vtex){
			for (var i = 0; i < this.vtex.length; i++) {
				if (this.vtex[i].vtexture && this.vtex[i].vtexture.ready) {
					this.vtex[i].vtexture.update();
				}
			}
		}

		if(this.has_controls && this.controls){
			this.controls.update();
		}

		// if(!MYTIMER_FIN){
		// 	MYTIMER = Date.now() - MYTIMER_START;
		// 	var timeElapsed = new Date(MYTIMER);
		// 	var hour = timeElapsed.getUTCHours();
		// 	var min = timeElapsed.getUTCMinutes();
		// 	var sec = timeElapsed.getUTCSeconds();
		// 	var ms = timeElapsed.getUTCMilliseconds();
		// 	var ms2 = ms/1000;
		// 	ms2 = Math.round(ms2 * 100); // / 100
		// 	//console.log(hour+":"+min+":"+sec+":"+ms);
		// 	if(this.update_counter%2==0){
		// 		var zero_append = "";
		// 		if((''+ms2).length==1){zero_append = "0";}
		// 		if((''+ms2).length==0){zero_append = "00";}
		// 		// if(ms2.countDecimals()==1){zero_append = "0";}
		// 		// if(ms2.countDecimals()==0){zero_append = "00";}
		// 		var zero_prepend1 = "";
		// 		if(sec<10){zero_prepend1 = "0";}
		// 		var zero_prepend2 = "";
		// 		if(min<10){zero_prepend2 = "0";}
		// 		document.getElementById("time").innerHTML = zero_prepend2+""+min+":"+zero_prepend1+""+sec+":"+ms2+zero_append;
		// 		// $("#timer").html(zero_prepend2+""+min+":"+zero_prepend1+""+sec+":"+ms2+zero_append);
		// 	}
		// }

		//fixed fps
		if(this.fixed_fps){
			this.dt = Date.now() - this.time;
			if (this.dt < 1 / (this.fixed_fps / 1000)) {
				//~41.6 for 24fps
				this.wait(() => {
					this.run_render();
					this.time = Date.now();
				});
			}else{
				// console.log("uhoh, slower than target 24fps");
				this.run_render();
				this.time = Date.now();
			}
		}else{
			this.run_render();
		}
	}

	//=========================================================================================================
	run_render() {
		this.renderer.render(this.scene, this.camera);
	}

	//=========================================================================================================
	wait(_cb) {
		setTimeout(() => {
			this.dt = Date.now() - this.time;
			if (this.dt < 1 / (this.fixed_fps / 1000)) {
				//~41.6 for 24fps
				this.wait(_cb);
			} else {
				_cb();
			}
		}, 5); //5ms
	}

	//=========================================================================================================
	start() {
		if (!this.running) {
			this.running = true;
			this.renderer.setAnimationLoop(this.render.bind(this));
		}
	}

	//=========================================================================================================
	stop() {
		if (this.running) {
			this.running = false;
		}
	}

	set_hdr() {
		this.hdr_loader
			.setPath( 'assets/hdr/' )
			.load( this.settings.hdr, function ( texture ) {
				texture.mapping = THREE.EquirectangularReflectionMapping;
				if(_G.MYSCENE.settings.background){
					_G.MYSCENE.scene.background = texture;
				} else {
					_G.MYSCENE.scene.background = (_G.MYSCENE.settings.background_color, _G.MYSCENE.settings.background_opacity);
				}
				_G.MYSCENE.scene.environment = texture;
			} );
	}

	update_hdr() {
		this.hdr_loader
			.setPath( 'assets/hdr/' )
			.load( this.settings.hdr, function ( texture ) {
				texture.mapping = THREE.EquirectangularReflectionMapping;
				if(_G.MYSCENE.settings.background){
					_G.MYSCENE.scene.background = texture;
				} else {
					_G.MYSCENE.scene.background = (_G.MYSCENE.settings.background_color, _G.MYSCENE.settings.background_opacity);
				}
				_G.MYSCENE.scene.environment = texture;

			} );
	}

	//=========================================================================================================
	setup_gui() {
		// world
		//-----------------------------------------------------------------------------------------------------
		this.gui_camera
			.add(this.settings, "fov", 25, 125, 1)
			.name("Camera FOV")
			.onChange((val) => {
				this.camera.fov = val;
				// console.log(this.camera.position);
				// var pi = Math.PI;
				// var zoomDistance = 3 / (2 * Math.tan(0.5 * (val * (pi/180))));
				// var factor = zoomDistance/this.camera.position.length();
				// this.camera.position.x *= factor;
				// this.camera.position.y *= factor;
				// this.camera.position.z *= factor;
				this.camera.updateProjectionMatrix();
			});
		this.gui_camera
			.add(this.settings.camera_initial_position, "x", -20, 20, 0.01)
			.name("Camera X")
			.onChange((val) => {
				this.camera.position.x = val;
			});
		this.gui_camera
			.add(this.settings.camera_initial_position, "y", -20, 20, 0.01)
			.name("Camera Y")
			.onChange((val) => {
				this.camera.position.y = val;
			});
		this.gui_camera
			.add(this.settings.camera_initial_position, "z", 0, 20, 0.01)
			.name("Camera Z")
			.onChange((val) => {
				this.camera.position.z = val;
			});

		this.gui_scene.add(this.settings, 'videoScale', 0.1, 2, 0.01).name('Video Scale').onChange((val)=>{
			this.videoPlane.scale.set(this.settings.videoScale,this.settings.videoScale,this.settings.videoScale);
		});
		this.gui_scene.add(this.settings, 'background').name('Show HDR').onChange((val)=>{
			this.update_hdr();
		});
		this.gui_scene.add(this.settings, 'hdr', this.settings.envs).onChange((val)=>{
			this.update_hdr();
		}).listen();
		this.gui_scene
			.add(this, "debug")
			.name("DEBUG")
			.onChange((val) => {
				console.log("debug", val)
			});
		this.gui_scene
			.add(this.settings, "encoding", this.encoding_settings)
			.name("TEXTURE ENCODING")
			.onChange((val) => {
				console.log(val);
				console.log(typeof(val));
				var val2 = parseInt(val);
				console.log(typeof(val2));
				_G.MYSCENE.renderer.outputEncoding = val2;
			});
		this.gui_scene.add(this.settings, "fog_near", 0, 20, 1).onChange((val) => {
			this.scene.fog.near = val;
		});
		this.gui_scene.add(this.settings, "fog_depth", 1, 100, 1).onChange((val) => {
			this.scene.fog.far = this.scene.fog.near + val;
		});
		this.gui_scene.addColor(this.settings, "background_color").name("fog_color").onChange((colorValue) => {
			this.renderer.setClearColor(colorValue, 1);
			this.scene.fog.color.set(colorValue);
		});

		// lights
		//-----------------------------------------------------------------------------------------------------
		this.gui_hlight = this.gui_lights.addFolder("HEMISPHERE LIGHT");
		this.gui_hlight.add(this.settings, "hlight_visible").onChange((val) => {
			this.hlight.visible = val;
		})
		this.gui_hlight
			.add(this.settings, "hlight_intensity", 0.1, 3.0, 0.01)
			.onChange((val) => {
				this.hlight.intensity = val;
			}).listen();
		this.gui_hlight.addColor(this.settings, "hlight_color").name("hlight sky color").onChange((colorValue) => {
				this.hlight.color.set(colorValue);
		}).listen();
		this.gui_hlight.addColor(this.settings, "hlight_ground_color").name("hlight ground color").onChange((colorValue) => {
				this.hlight.groundColor.set(colorValue);
		}).listen();
		
		this.gui_dlight = this.gui_lights.addFolder("DIRECT LIGHT");
		this.gui_dlight.add(this.settings, "dlight_visible").onChange((val) => {
			this.dlight.visible = val;
		})
		this.gui_dlight.add(this.settings, "dlight_intensity", 0.1, 3.0, 0.01).onChange((val) => {
			this.dlight.intensity = val;
		}).listen();
		this.gui_dlight.addColor(this.settings, "dlight_color").name("dlight color").onChange((colorValue) => {
			this.dlight.color.set(colorValue);
		}).listen();
		this.gui_dlight.add(this.settings, "dlight_x", -15, 15, 0.01).onChange((val) => {
			this.dlight.position.x = val;
		}).listen();
		this.gui_dlight.add(this.settings, "dlight_z", -15, 15, 0.01).onChange((val) => {
			this.dlight.position.z = val;
		}).listen();
		this.gui_dlight.add(this.settings, "dlight_y", 0, 50, 0.01).onChange((val) => {
			this.dlight.position.y = val;
		}).listen();
	}
}


