import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class Debugger {
    private camera: THREE.Camera;
    private renderer: THREE.Renderer;
    private controls: OrbitControls | null = null;
    public enabled: boolean;

    constructor(
        camera: THREE.Camera,
        renderer: THREE.Renderer,
        enabled: boolean = false
    ) {
        this.camera = camera;
        this.renderer = renderer;
        this.enabled = enabled;

        if (this.enabled) {
            this.controls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            );

            document.addEventListener("keydown", (evt) => {
                // if (evt.code == "KeyF") {
                //     if (this.controls) {
                //         this.controls.target.x = this.camera.position.x;
                //         this.controls.target.y = this.camera.position.y;
                //         this.controls.target.z = this.camera.position.z;
                //     }
                // }
            });
        }

        if (this.enabled && this.saveExists()) this.loadFromSave();
        else this.clearSave();
    }

    saveExists() {
        return localStorage.getItem("cameraPosn") ? true : false;
    }

    clearSave() {
        localStorage.removeItem("cameraPosn");
        this.camera.position.y = 3;
    }

    savePosition() {
        localStorage.setItem(
            "cameraPosn",
            [
                this.camera.position.x,
                this.camera.position.y,
                this.camera.position.z,
                this.camera.rotation.x,
                this.camera.rotation.y,
                this.camera.rotation.z,
                this.controls?.target.x,
                this.controls?.target.y,
                this.controls?.target.z
            ].join(",")
        );
    }

    loadFromSave() {
        var [px, py, pz, rx, ry, rz, tx, ty, tz] = (localStorage.getItem(
            "cameraPosn"
        ) as string).split(",");

        this.camera.position.x = parseFloat(px);
        this.camera.position.y = parseFloat(py);
        this.camera.position.z = parseFloat(pz);
        this.camera.rotation.x = parseFloat(rx);
        this.camera.rotation.y = parseFloat(ry);
        this.camera.rotation.z = parseFloat(rz);

        if (this.controls) {
            this.controls.target.x = parseFloat(tx);
            this.controls.target.y = parseFloat(ty);
            this.controls.target.z = parseFloat(tz);
        }
    }

    debugFrame() {
        if (this.controls) {
            this.savePosition();
        }
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}
