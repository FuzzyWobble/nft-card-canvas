/*

    var settings = {
        uid:                    "someuid",
        url:                    "vid/noise.mp4",                    //url of content: must be mp4 or jpg or png
        mesh:                   _G.MYTHREE.cube,                    //(OPTIONAL) threejs mesh. the texture is returned in the init() callback to use as you like in the case you dont pass a mesh
        three:                  _G.MYTHREE,                         //three
        resolution:             {x:256,y:256},                      //resolution of video, lower helps performance
        offset:                 {x:0,y:0},                          //(OPTIONAL) position offset of texture, 0-1
        repeat:                 {x:1,y:1},                          //(OPTIONAL) repeat of texture, 1-inf
        animation:              {x:0,y:0},                          //(OPTIONAL) texture animation
        rotation:               0,                                  //(OPTIONAL) texture rotation
        wrap:                   THREE.MirroredRepeatWrapping,       //(OPTIONAL) THREE.RepeatWrapping,THREE.ClampToEdgeWrapping,THREE.MirroredRepeatWrapping
        magFilter:              THREE.LinearFilter,                 //(OPTIONAL) THREE.NearestFilter,THREE.LinearFilter
        minFilter:              THREE.LinearMipmapLinearFilter,     //(OPTIONAL) THREE.NearestFilter,THREE.NearestMipmapNearestFilter,THREE.NearestMipmapLinearFilter,THREE.LinearFilter,THREE.LinearMipmapNearestFilter,THREE.LinearMipmapLinearFilter
        threshold:              5.5,                                //(OPTIONAL) At 5.5m is the playback threshold
        audioFile:              "audio/some.mp3"                    //(OPTIONAL) add audio to an image texture
        osnoise:                0,                                  //(OPTIONAL) offset noise. If osnoise is set to 3 then will apply Math.random() to offset every 3 frames
        audio:                  false,                              //(OPTIONAL) will disable audio on video
        duplicate_to_meshes:    []                                  //(OPTIONAL) meshes to duplicate video to
    };

*/

class VideoTexture{

    //=============================================================
    constructor(_settings){

        this.settings = _settings;
        if(this.settings.url.includes(".mp4")){
            this.type="video";
        }
        if(this.settings.url.includes(".jpg")||this.settings.url.includes(".jpeg")||this.settings.url.includes(".png")){
            this.type="image";
        }

        this.mesh = this.settings.mesh;
        if(!this.settings.mesh){
            console.error("Mesh is not ready for util-texturing: "+this.settings.uid);
            return;
        }
        
        this.ready = false;
        this.update_counter = 0;
        this.texture;
        this.mp3;
        this.volume = 0;
        this.audio_playing = false;
        this.video_playing = false;
        this.video;

        this.gui_material = {

            blending:               "Normal",
            blending_arr:           { 
                Normal:             THREE.NormalBlending, 
                Additive:           THREE.AdditiveBlending, 
                Subtractive:        THREE.SubtractiveBlending,
                Multiply:           THREE.MultiplyBlending,
                None:               THREE.NoBlending,
            },
            blendingArr:            [THREE.NormalBlending,THREE.AdditiveBlending,THREE.SubtractiveBlending,THREE.MultiplyBlending,THREE.CustomBlending,THREE.NoBlending],
            opacity:                1.0,
            color:                  0x000000,

        };

        this.gui_texture = {

            wrap:                   "Repeat",
            wrap_arr:               {
                Repeat:             THREE.RepeatWrapping,
                ClampToEdge:        THREE.ClampToEdgeWrapping,
                MirrorRepeat:       THREE.MirroredRepeatWrapping
            },
            wrapArr:                [THREE.RepeatWrapping,THREE.ClampToEdgeWrapping,THREE.MirroredRepeatWrapping],
            magFilter:              "Linear",
            magFilter_arr:          {
                Linear:             THREE.LinearFilter,
                Nearest:            THREE.NearestFilter
            },
            magFilterArr:           [THREE.NearestFilter,THREE.LinearFilter],
            minFilter:              "LinearMipmapLinear",
            minFilter_arr:          {
                Nearest:                THREE.NearestFilter,
                NearestMipmapNearest:   THREE.NearestMipmapNearestFilter,
                NearestMipmapLinear:    THREE.NearestMipmapLinearFilter,
                Linear:                 THREE.LinearFilter,
                LinearMipmapNearest:    THREE.LinearMipmapNearestFilter,
                LinearMipmapLinear:     THREE.LinearMipmapLinearFilter
            },
            minFilterArr:           [THREE.NearestFilter,THREE.NearestMipmapNearestFilter,THREE.NearestMipmapLinearFilter,THREE.LinearFilter,THREE.LinearMipmapNearestFilter,THREE.LinearMipmapLinearFilter],
            offset:                 {x:0,y:0},
            repeat:                 {x:1,y:1},
            animation:              {x:0,y:0},
            rotation:               0,

        };


        this.is_ios = false;
        if(navigator.userAgent.toLowerCase().indexOf('iphone') > -1){ this.is_ios = true; }
        if(navigator.userAgent.toLowerCase().indexOf('ipad') > -1){ this.is_ios = true; }
        var ar_elem = document.createElement("a");
        this.is_modern_ios = ar_elem.relList.supports("ar"); 
        if(this.is_modern_ios){ this.is_ios = true; } //modern ios trys to trick
        this.is_safari = false;
        var ua = navigator.userAgent.toLowerCase(); 
        if(ua.indexOf('safari')!=-1 && ua.indexOf('chrome')==-1){ 
            this.is_safari = true;
        }

        //need to interact with a 2D dom elem to unmute on ios and safari
        this.waiting_for_click_to_unmute_for_ios_or_safari = false;
        if(this.is_ios||this.is_safari){
            this.waiting_for_click_to_unmute_for_ios_or_safari = true;
        }
        this.unmute_button;


    }

    //========================================================================================
    //you must call init
    init(_cb){

        if(this.type==="video"){ this.setup_texture_video(_cb); }
        if(this.type==="image"){ this.setup_texture_image(_cb); }
        if('audioFile' in this.settings){ this.setup_audio(); } //we can add audio to image

    }

    //========================================================================================
    update(){

        if(!this.ready){return;}

        this.update_counter++;
        if(this.update_counter>10000){ this.update_counter = 0; }

        //==============================================
        //video update canvas
        if(this.type==="video"){
            if( this.video.readyState === this.video.HAVE_ENOUGH_DATA ){
                this.videoImageContext.drawImage( this.video, 0, 0, this.settings.resolution.x,this.settings.resolution.y );
                if(this.texture){ this.texture.needsUpdate = true; }
            }
            if('animation' in this.settings){
                this.texture.offset.x += this.settings.animation.x;
                this.texture.offset.y += this.settings.animation.y;
            }
        }
        
        //==============================================
        //image noise
        if(this.type==="image"){
            if('osnoise' in this.settings && this.settings.osnoise>0){ //offset noise
                if(this.texture){
                    if(this.update_counter%this.settings.osnoise===0){
                        this.texture.offset.x = Math.random();
                        this.texture.offset.y = Math.random();
                    }
                }

            }
        }

        //==============================================
        //threshold
        // if('threshold' in this.settings && this.settings.mesh && this.settings.three){
        //     var distance = this.settings.three.camera.position.distanceTo( this.settings.mesh.position );

        //     if(distance<this.settings.threshold){

        //         this.play_audio_if_not_already_playing();
        //         this.play_video_if_not_already_playing();
        //         var v = 1.0 - ((distance/this.settings.threshold)); 
        //         if(v>1){v=1;}
        //         if(v<0){v=0;}
        //         //console.log("v-in:"+v);
        //         this.volume = this.num_map(v,0,1,0,0.30); //howler max volume is around 0.4
        //         //console.log("v-out:"+this.volume);
        //         this.set_volume(this.volume);

        //         //console.log("texv:"+this.volume);

        //     }else{
        //         this.stop_audio_if_not_already_stopped();
        //         this.stop_video_if_not_already_stopped();
        //     }
        // }
        // if(!'threshold' in this.settings){
        //     this.play_audio_if_not_already_playing();
        //     this.play_video_if_not_already_playing();
        // }

    }
    num_map(num, in_min, in_max, out_min, out_max){
        return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    //========================================================================================
    start(){
        this.play_video_if_not_already_playing();
        this.play_audio_if_not_already_playing();
    }
    stop(){
        this.stop_video_if_not_already_stopped();
        this.stop_audio_if_not_already_stopped();
    }

    get_pct(){
        if(!this.video){return 0;}
        var pct = this.video.currentTime/this.video.duration;
        if(isNaN(pct)){return 0;}
        return pct;
    }
    set_pct(_pct){
        if(!this.video){return;}
        if(isNaN(_pct)){return;}
        this.video.currentTime = _pct*this.video.duration;
    }


    //========================================================================================
    setup_audio(){
        this.mp3 = new Howl({
            src: [this.settings.audioFile],
            autoplay: true,
            loop: true,
            volume: 0,
          });
    }
    play_video_if_not_already_playing(){
        if(!this.video_playing){
            if(this.type==="video" && this.video){
                this.video.play();
                this.video_playing = true;
            }
        }
    }
    play_audio_if_not_already_playing(){
        if(!this.audio_playing){
            if(this.type==="image" && this.mp3){
                this.mp3.play();
                this.audio_playing = true;
            }
        }
    }
    stop_video_if_not_already_stopped(){
        if(this.video_playing){
            if(this.type==="video" && this.video){
                this.video.pause();
                this.video_playing = false;
            }
        }
    }
    stop_audio_if_not_already_stopped(){
        if(this.audio_playing){
            if(this.type==="image" && this.mp3){
                this.mp3.stop();
                this.audio_playing = false;
            }
        }
    }
    //========================================================================================
    //video controls
    pause(){
        if(this.type==="video" && this.video){ this.video.pause(); }
    }
    play(){
        if(this.type==="video" && this.video){ this.video.play(); }
    }
    set_volume(_v){
        if(this.waiting_for_click_to_unmute_for_ios_or_safari==true){return;} //need to click to unmute
        if(this.type==="video" && this.video){ this.video.volume = _v; }
        if(this.is_safari||this.is_ios){
            if(this.type==="video" && this.video){
                if(_v<=0){
                    this.video.muted = true;
                }else{
                    this.video.muted = false;
                }
            }
        }
        if(this.mp3){ this.mp3.volume(_v); }
    }
    create_unmute_button_for_ios_or_safari(_color,_msg,_f){
        if(this.unmute_button){ //already created
            console.log("already created unmute button");
            return;
        }
        this.unmute_button = document.createElement('div');
        document.body.appendChild(this.unmute_button);
        this.unmute_button.id = "unmute_button_for_ios_or_safari";
        this.unmute_button.style.position = 'absolute';
        this.unmute_button.style.zIndex = 999;  
        this.unmute_button.style.fontSize = "12px";
        this.unmute_button.style.fontFamily = "Arial, Helvetica, sans-serif";
        this.unmute_button.style.fontWeight = "600";
        this.unmute_button.style.width = "220px";  
        var cleft = "calc(50% - 110px)";  
        var ctop = "calc(50% - 15px)";  
        this.unmute_button.style.left = cleft; 
        this.unmute_button.style.top = ctop;
        this.unmute_button.style.color = _color; 
        this.unmute_button.style.border = "2px solid "+_color; 
        this.unmute_button.style.textAlign = "center";
        this.unmute_button.style.padding = "8px"; 
        this.unmute_button.innerHTML = _msg;
        $(document).on('click','#unmute_button_for_ios_or_safari',()=>{
            this.disable_muted();
            $("#unmute_button_for_ios_or_safari").hide();
            _f();
        });
    }

    //========================================================================================
    setup_texture_image(_cb){

        var loader = new THREE.TextureLoader( _G.MYSCENE.manager);

        loader.load( this.settings.url, (texture)=>{

            this.imageTexture = texture;
            this.texture = this.imageTexture;

            this.apply_texture_settings();

            this.texture.needsUpdate = true;

            if(this.settings.mesh){

                //var m = new THREE.MeshBasicMaterial( { map:this.imageTexture, side:THREE.DoubleSide, skinning:true } );

                this.settings.mesh.traverse((child)=>{
                    if(child.isMesh && child.material){ 
                        child.material.map = this.texture;
                        child.material.side = THREE.DoubleSide;
                        child.material.needsUpdate = true;
                    }
                });
            }
            this.ready = true;
            _cb(this.texture);
        });

    }

    //========================================================================================
    change_texture(_url,_cb){
        // if(this.texture){
        //     this.texture.dispose();
        //     this.texture = undefined;
        // }
        this.ready = false;
        this.video.pause();
        this.video.currentTime = 0;
        this.video.src = _url;
        var tloader = new THREE.TextureLoader();
        tloader.load( _url, (_tex)=>{
            console.log("new video texture loaded");
            this.imageTexture = _tex;
            this.texture = this.imageTexture;
            this.apply_texture_settings();
            this.texture.needsUpdate = true;
            if(this.settings.mesh){
                this.settings.mesh.traverse((child)=>{
                    if(child.isMesh && child.material){ 
                        child.material.map = this.texture;
                        child.material.side = THREE.DoubleSide;
                        child.material.needsUpdate = true;
                    }
                });
            }
            this.ready = true;
            _cb();
        });
    }

    //========================================================================================
    setup_texture_video(_cb){

        this.parent = document.getElementById("mythree");

        this.video = document.createElement('video');
        this.video.loop = true;
        this.video.src = this.settings.url;
        this.video.setAttribute('webkit-playsinline', ''); //ios audio in bg?
        this.video.setAttribute('crossOrigin', 'anonymous'); //ios audio in bg?
        this.video.setAttribute('playsinline', ''); //ios audio in bg?
        //this.video.style.display = "none";
        this.parent.appendChild(this.video);
        this.video.id = "video_for_vtexture_"+this.settings.uid;
        this.video.style.position = 'absolute';
        // this.video.style.visibility = "hidden";
        this.video.style.zIndex = -999;
        if(this.is_ios||this.is_safari){ //we have to mute video at first on ios/safari 
            this.video.muted = true;
        }else if('muted' in this.settings && this.settings.muted){
            this.video.muted = true;
        }else{
            this.video.muted = false;
        }
        this.video.load();
        this.videoImage = document.createElement('canvas');
        this.parent.appendChild(this.videoImage);
        this.videoImage.id = "canvas_for_vtexture_"+this.settings.uid;
        this.videoImage.width = this.settings.resolution.x;
        this.videoImage.height = this.settings.resolution.y;
        this.videoImageContext = this.videoImage.getContext('2d');
        this.videoImageContext.fillStyle = '#000000';
        this.videoImage.style.position = 'absolute';
        // this.videoImage.style.display = "none";
        // this.videoImage.style.visibility = "hidden";
        this.videoImage.style.zIndex = -999;
        this.videoImageContext.fillRect( 0, 0, this.videoImage.width, this.videoImage.height );
        this.videoTexture = new THREE.VideoTexture( this.videoImage );
        this.texture = this.videoTexture;


        this.apply_texture_settings();

        if(this.settings.mesh){

            //var m = new THREE.MeshBasicMaterial( { map:this.videoTexture, side:THREE.DoubleSide, skinning:true } );
            this.settings.mesh.traverse((child)=>{
                if(child.isMesh && child.material){ 
                    child.material.map = this.videoTexture;
                    child.material.side = THREE.DoubleSide;
                    child.material.needsUpdate = true; 
                }
            });

            //duplicate video to other meshes
            // if(_G.MYTRACK && _G.MYTRACK.mesh){
            //     if('duplicate_to_meshes' in this.settings && this.settings.duplicate_to_meshes.length>0){ 
            //         for(var i=0;i<this.settings.duplicate_to_meshes.length;i++){
            //             _G.MYTRACK.mesh.traverse((_child) => {
            //                 if(_child.isMesh && _child.material){
            //                     if(_child.name.includes(this.settings.duplicate_to_meshes[i])){
            //                         _child.material.map = this.videoTexture;
            //                         _child.material.side = THREE.DoubleSide;
            //                         _child.material.needsUpdate = true;
            //                     }
            //                 }
            //             });
            //         }
            //     }
            // }else{
            //     console.error("track mesh is not ready");
            // }


        }

        this.ready = true;
        _cb(this.texture);        

    }

    //========================================================================================
    update_video_src(_src){
        if(this.video){
            this.stop_video_if_not_already_stopped();
            setTimeout(()=>{
                this.video.src = _src;
                setTimeout(()=>{
                    this.play_video_if_not_already_playing();
                },100);
            },100);

        }
    }

    //========================================================================================
    disable_muted(){
        if(this.video){
            this.video.muted = false;
            this.waiting_for_click_to_unmute_for_ios_or_safari = false;
        }
    }

    //========================================================================================
    apply_texture_settings(){
        this.texture.encoding = THREE.sRGBEncoding; // or THREE.LinearEncoding
        if('minFilter' in this.settings){ 
            this.texture.minFilter = this.settings.minFilter; 
        }
        if('magFilter' in this.settings){ 
            this.texture.magFilter = this.settings.magFilter; 
        }
        if('wrap' in this.settings){
            this.texture.wrapS = this.settings.wrap;
            this.texture.wrapT = this.settings.wrap;
        }else{
            this.texture.wrapS = THREE.RepeatWrapping;
            this.texture.wrapT = THREE.RepeatWrapping;
        }
        if('repeat' in this.settings){ 
            this.texture.repeat.set( this.settings.repeat.x,this.settings.repeat.y ); 
        }else{
            this.texture.repeat.set( 1,1 ); 
        }
        if('offset' in this.settings){ 
            this.texture.offset.set( this.settings.offset.x, this.settings.offset.y ); 
        }else{
            this.texture.offset.set( 0,0 ); 
        }
        if('rotation' in this.settings){ 
            this.texture.rotation = this.settings.rotation; 
        }else{
            this.texture.rotation = 0; 
        }
    }




    //========================================================================================
    setup_gui(_gf){


        this.gui_folder = _gf.addFolder("Video Texture: "+this.settings.uid);

        if(!this.gui_folder){
            console.warning("video-texture can't create gui until gui_folder is defined with set_gui_folder.");
            return;
        }



        //==================================================
        //material, blending SELECT
        var gui_select_blending = this.gui_folder.add(this.gui_material, 'blending', this.gui_material.blending_arr).onChange((_val)=>{    
            if(this.settings.mesh){
                this.settings.mesh.traverse((child)=>{
                    if(child.isMesh && child.material){ 
                        child.material.blending = parseInt(_val);
                    }
                });
            }
        });
        var blending_slected = THREE.NormalBlending;
        if('blending' in this.settings){ //we can set blending in settings if we like
            blending_slected = this.settings.blending;
        }
        for(var key in this.gui_material.blending_arr){
            if(this.gui_material.blending_arr[key]===blending_slected){
                this.settings.mesh.traverse((child)=>{
                    if(child.isMesh && child.material){ 
                        child.material.blending = blending_slected;
                    }
                });
                gui_select_blending.setValue(blending_slected);
                break;
            }
        }


        //==================================================
        //material, opacity
        this.gui_folder.add( this.gui_material, "opacity", 0.1, 1 ).step(0.01).onChange((_val)=>{    
            if(this.settings.mesh){
                this.settings.mesh.traverse((child)=>{
                    if(child.isMesh && child.material){ 
                        child.material.transparent = true;
                        child.material.opacity = _val; 
                    }
                });
            }
        });


        //==================================================
        //material, color
        this.gui_folder.addColor( this.gui_material, 'color' ).onChange((_val)=>{
            if(this.settings.mesh){
                this.settings.mesh.traverse((child)=>{
                    if(child.isMesh && child.material){ 
                        child.material.color.set(_val);
                    }
                });
            }
        });


        //==================================================
        //texture, wrap SELECT
        var gui_select_wrap = this.gui_folder.add(this.gui_texture, 'wrap', this.gui_texture.wrap_arr).onChange((_val)=>{    
            if(this.videoTexture){
                //console.log("wrap: "+_val);
                this.videoTexture.wrapS = parseInt(_val);
                this.videoTexture.wrapT = parseInt(_val);
            }
        });
        var wrap_slected = THREE.RepeatWrapping;
        if('wrap' in this.settings){ 
            wrap_slected = this.settings.wrap;
        }
        for(var key in this.gui_texture.wrap_arr){
            if(this.gui_texture.wrap_arr[key]===wrap_slected){
                if(this.videoTexture){
                    this.videoTexture.wrapS = wrap_slected;
                    this.videoTexture.wrapT = wrap_slected;
                }
                gui_select_wrap.setValue(wrap_slected);
                break;
            }
        }


        // //==================================================
        // //texture, mag filter
        // this.gui_folder.add(this.gui_texture, 'magFilter', { 
        //     Nearest:            THREE.NearestFilter, 
        //     Linear:             THREE.LinearFilter, 
        // }).onChange((_val)=>{    
        //     console.log("mag filter: "+_val);
        //     if(this.videoTexture){
        //         this.videoTexture.magFilter = parseInt(_val);
        //     }
        // });

        // //==================================================
        // //texture, min filter
        // this.gui_folder.add(this.gui_texture, 'minFilter', { 
        //     Nearest:                    THREE.NearestFilter, 
        //     NearestMipmapNearest:       THREE.NearestMipmapNearestFilter, 
        //     NearestMipmapLinear:        THREE.NearestMipmapLinearFilter,
        //     Linear:                     THREE.LinearFilter,
        //     LinearMipmapNearest:        THREE.LinearMipmapNearestFilter,
        //     LinearMipmapLinear:         THREE.LinearMipmapLinearFilter
        // }).onChange((_val)=>{    
        //     console.log("min filter: "+_val);
        //     if(this.videoTexture){
        //         this.videoTexture.minFilter = parseInt(_val);
        //     }
        // });


        //==================================================
        //texture, offset
        var gui_offset_x = this.gui_folder.add( this.gui_texture.offset, "x", 0, 1 ).name("Offset X").step(0.01).onChange((_val)=>{    
            console.log("offset x: "+_val);
            if(this.texture){
                this.texture.offset.x = _val;
            }
        });
        var gui_offset_y = this.gui_folder.add( this.gui_texture.offset, "y", 0, 1 ).name("Offset Y").step(0.01).onChange((_val)=>{    
            console.log("offset y: "+_val);
            if(this.texture){
                this.texture.offset.y = _val;
            }
        });
        if('offset' in this.settings){
            gui_offset_x.setValue(this.settings.offset.x);
            gui_offset_y.setValue(this.settings.offset.y);
        }

        //==================================================
        //texture, repeat
        var gui_repeat_x = this.gui_folder.add( this.gui_texture.repeat, "x", -10, 10 ).name("Repeat X").step(1).onChange((_val)=>{    
            console.log("repeat x: "+_val);
            if(this.texture){
                this.texture.repeat.x = _val;
            }
        });
        var gui_repeat_y = this.gui_folder.add( this.gui_texture.repeat, "y", -10, 10 ).name("Repeat Y").step(1).onChange((_val)=>{    
            console.log("repeat y: "+_val);
            if(this.texture){
                this.texture.repeat.y = _val;
            }
        });
        if('repeat' in this.settings){
            gui_repeat_x.setValue(this.settings.repeat.x);
            gui_repeat_y.setValue(this.settings.repeat.y);
        }

        //==================================================
        //texture, animation
        // var gui_animation_x = this.gui_folder.add( this.gui_texture.animation, "x", -0.1, 0.1 ).name("Animation X").step(0.001).onChange((_val)=>{    
        //     console.log("animation x: "+_val);
        //     if(this.texture){
        //         this.settings.animation.x = _val;
        //     }
        // });
        // var gui_animation_y = this.gui_folder.add( this.gui_texture.animation, "y", -0.1, 0.1 ).name("Animation Y").step(0.001).onChange((_val)=>{    
        //     console.log("animation y: "+_val);
        //     if(this.texture){
        //         this.settings.animation.y = _val;
        //     }
        // });
        // if('animation' in this.settings){
        //     gui_animation_x.setValue(this.settings.animation.x);
        //     gui_animation_y.setValue(this.settings.animation.y);
        // }

        //==================================================
        //texture, rotation
        var gui_rotation = this.gui_folder.add( this.gui_texture, "rotation", 0, Math.PI*2 ).name("Roration").step(0.01).onChange((_val)=>{    
            console.log("rotation: "+_val);
            if(this.texture){
                this.texture.rotation = _val;
            }
        });
        if('rotation' in this.settings){
            gui_rotation.setValue(this.settings.rotation);
        }
        
        
    }


}










