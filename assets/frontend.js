
import RegionsPlugin from './regions.esm.js'
class ClipVideo {
    constructor() {
        this.wavesurfer = null
        this.wsRegions = null
        this.ffmpeg = null
        this.originFile = null
        this.init()
    }
    init() {
        console.log('init')
        this.initWavesurfe();
        this.initFfmpeg()
        this.bindSelectOriginFile()
        this.bindCutBtn()
    }
    
    transformSecondToVideoFormat(value = 0) {
        const totalSecond = Number(value)
        let hours = Math.floor(totalSecond / (60 * 60))
        let minutes = Math.floor(totalSecond / 60) % 60
        let second = totalSecond % 60
        let hoursText = ''
        let minutesText = ''
        let secondText = ''
        if (hours < 10) {
            hoursText = `0${hours}`
        } else {
            hoursText = `${hours}`
        }
        if (minutes < 10) {
            minutesText = `0${minutes}`
        } else {
            minutesText = `${minutes}`
        }
        if (second < 10) {
            secondText = `0${second}`
        } else {
            secondText = `${second}`
        }
        return `${hoursText}:${minutesText}:${secondText}`
    }
    initFfmpeg() {
        const { createFFmpeg } = FFmpeg;
        this.ffmpeg = createFFmpeg({
            log: true,
            corePath: './assets/ffmpeg-core.js',
        });
    }
    initWavesurfe() {
        this.wavesurfer = WaveSurfer.create({
            interact: false,
            container: '#waveform'
        });
        
        this.wsRegions = this.wavesurfer.registerPlugin(RegionsPlugin.create());
        this.wsRegions.on('region-clicked', (region, e) => {
            e.stopPropagation() // prevent triggering a click on the waveform
            activeRegion = region
            region.play()
            region.setOptions({ color: randomColor() })
        })

        this.wsRegions.enableDragSelection({
            color: 'rgba(255, 0, 0, 0.1)',
        })
    }
    bindCutBtn() {
        btnCut.addEventListener('click',  async () => {
            const regions = this.wsRegions.getRegions();
            console.log(regions);
            btnCut.disabled = true;
            for (var i = 0; i < regions.length; i ++) {
                await this.clipAudio(this.originFile, regions[i].start, regions[i].end, i)
            }
        });
        btnCut.disabled = true;
    }
    bindSelectOriginFile() {
        $('#select_origin_file').on('change', (e) => {

            const file = e.target.files[0]
            this.originFile = file
            const url = window.webkitURL.createObjectURL(file)
            this.wavesurfer.load(url);
            document.getElementById('select_origin_file').disabled = true;
            btnCut.disabled = false;
        })
    }
    async clipAudio(file, start, end, idx) {
        const { ffmpeg } = this
        const { fetchFile } = FFmpeg;
        const { name } = file;
        const startTime = this.transformSecondToVideoFormat(start)
        const endTime = this.transformSecondToVideoFormat(end)
        console.log('clipRange', startTime, endTime)
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }
        ffmpeg.FS('writeFile', name, await fetchFile(file));
        console.log('writeFile name: ' + name)
        await ffmpeg.run('-i', name, '-ss', startTime, '-to', endTime, '-c:a', 'copy' , idx + '.wav');
        const data = ffmpeg.FS('readFile', idx + '.wav');
        const tempURL = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/wav' }));
        var elementA = document.createElement('a');
        //文件的名称为时间戳加文件名后缀
        elementA.download = + idx + ".wav";
        elementA.style.display = 'none';
        
        //生成一个指向blob的URL地址，并赋值给a标签的href属性
        elementA.href = tempURL;
        document.body.appendChild(elementA);
        elementA.click();
        document.body.removeChild(elementA);
        console.log(idx + '.wav')
    }
}

$(document).ready(function () {
    const instance = new ClipVideo()
});
