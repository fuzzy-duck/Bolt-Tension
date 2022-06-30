const VIDEOS = [
    "bolt_tension_-_waveform-01 (Original).mp4",
    "bolt_tension_-_waveform-02 (Original).mp4",
    "bolt_tension_-_waveform-03 (Original).mp4",
    "bolt_tension_-_waveform-04 (Original).mp4",
    "bolt_tension_-_waveform-05 (Original).mp4",
    "bolt_tension_-_waveform-06 (Original).mp4",
    "bolt_tension_-_waveform-07 (Original).mp4",
    "bolt_tension_-_waveform-08 (Original).mp4",
    "faulty/bolt_tension_-_waveform-09 (Original).mp4",
    "faulty/bolt_tension_-_waveform-10 (Original).mp4",
    "bolt_tension_-_waveform-11 (Original).mp4",
    "faulty/bolt_tension_-_waveform-12 (Original).mp4"
]

export const getWorkingVideo = () => {
    let index = 0
    do {
        index = Math.floor(Math.random() * VIDEOS.length)
    }while( VIDEOS[index].indexOf("faulty") > -1)
    return VIDEOS[index] // + '#t=0'
}

// here are 12 in total - 8 are normal, 9,10,12 & 12 are faulty:
export const getFaultyVideo = () => {
    let index = 0
    do {
        index = Math.floor(Math.random() * VIDEOS.length)
    }while( VIDEOS[index].indexOf("faulty") === -1)
    return VIDEOS[index] // + '#t=0'
}