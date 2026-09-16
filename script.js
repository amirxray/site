const {
    FFmpeg
} = FFmpegWASM;

const {
    fetchFile,
    toBlobURL
} = FFmpegUtil;


const ffmpeg = new FFmpeg();


let loaded = false;

let file = null;

let duration = 0;


const fileInput =
    document.getElementById("fileInput");

const editor =
    document.getElementById("editor");

const fileName =
    document.getElementById("fileName");

const video =
    document.getElementById("video");

const audio =
    document.getElementById("audio");

const start =
    document.getElementById("start");

const end =
    document.getElementById("end");

const startRange =
    document.getElementById("startRange");

const endRange =
    document.getElementById("endRange");

const cutButton =
    document.getElementById("cutButton");

const resetButton =
    document.getElementById("resetButton");

const status =
    document.getElementById("status");

const download =
    document.getElementById("download");

const progressBox =
    document.getElementById("progressBox");

const progressBar =
    document.getElementById("progressBar");


async function loadFFmpeg() {

    if (loaded)
        return;


    status.textContent =
        "در حال آماده‌سازی موتور برش...";


    ffmpeg.on(
        "progress",
        ({ progress }) => {

            progressBar.style.width =
                Math.round(progress * 100) + "%";

        }
    );


    const baseURL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";


    await ffmpeg.load({

        coreURL:
            await toBlobURL(
                `${baseURL}/ffmpeg-core.js`,
                "text/javascript"
            ),

        wasmURL:
            await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                "application/wasm"
            )

    });


    loaded = true;

    status.textContent =
        "موتور آماده است ✅";
}


fileInput.addEventListener(
    "change",
    () => {

        if (
            fileInput.files.length === 0
        )
            return;


        loadFile(
            fileInput.files[0]
        );

    }
);


function loadFile(selectedFile) {

    file = selectedFile;


    const url =
        URL.createObjectURL(file);


    fileName.textContent =
        file.name;


    if (
        file.type.startsWith("video/")
    ) {

        video.classList.remove(
            "hidden"
        );

        audio.classList.add(
            "hidden"
        );

        video.src = url;

        video.onloadedmetadata =
            setupMedia;

    } else {

        audio.classList.remove(
            "hidden"
        );

        video.classList.add(
            "hidden"
        );

        audio.src = url;

        audio.onloadedmetadata =
            setupMedia;
    }


    editor.classList.remove(
        "hidden"
    );


    download.classList.add(
        "hidden"
    );
}


function setupMedia() {

    duration =
        this.duration;


    start.value =
        0;


    end.value =
        duration.toFixed(1);


    startRange.max =
        duration;

    endRange.max =
        duration;


    startRange.value =
        0;

    endRange.value =
        duration;


    status.textContent =
        "فایل آماده برش است.";
}


startRange.addEventListener(
    "input",
    () => {

        start.value =
            startRange.value;

    }
);


endRange.addEventListener(
    "input",
    () => {

        end.value =
            endRange.value;

    }
);


start.addEventListener(
    "input",
    () => {

        startRange.value =
            start.value;

    }
);


end.addEventListener(
    "input",
    () => {

        endRange.value =
            end.value;

    }
);


cutButton.addEventListener(
    "click",
    async () => {

        if (!file)
            return;


        const startTime =
            Number(start.value);

        const endTime =
            Number(end.value);


        if (
            startTime < 0 ||
            endTime <= startTime ||
            endTime > duration
        ) {

            status.textContent =
                "زمان شروع و پایان صحیح نیست.";

            return;
        }


        try {

            cutButton.disabled =
                true;


            progressBox.classList.remove(
                "hidden"
            );


            progressBar.style.width =
                "0%";


            await loadFFmpeg();


            status.textContent =
                "در حال برش فایل...";


            const inputName =
                "input" +
                getExtension(file.name);


            const outputName =
                file.type.startsWith("video/")
                    ? "output.mp4"
                    : "output.mp3";


            await ffmpeg.writeFile(
                inputName,
                await fetchFile(file)
            );


            if (
                file.type.startsWith("video/")
            ) {

                await ffmpeg.exec([

                    "-ss",
                    String(startTime),

                    "-i",
                    inputName,

                    "-t",
                    String(
                        endTime - startTime
                    ),

                    "-c:v",
                    "libx264",

                    "-c:a",
                    "aac",

                    "-preset",
                    "veryfast",

                    outputName

                ]);

            } else {

                await ffmpeg.exec([

                    "-ss",
                    String(startTime),

                    "-i",
                    inputName,

                    "-t",
                    String(
                        endTime - startTime
                    ),

                    "-vn",

                    "-c:a",
                    "libmp3lame",

                    "-b:a",
                    "192k",

                    outputName

                ]);

            }


            const data =
                await ffmpeg.readFile(
                    outputName
                );


            const blob =
                new Blob(
                    [data.buffer],
                    {
                        type:
                            file.type.startsWith("video/")
                                ? "video/mp4"
                                : "audio/mpeg"
                    }
                );


            const url =
                URL.createObjectURL(blob);


            download.href =
                url;


            download.download =
                file.type.startsWith("video/")
                    ? "amirxray-cut.mp4"
                    : "amirxray-cut.mp3";


            download.classList.remove(
                "hidden"
            );


            status.textContent =
                "برش با موفقیت انجام شد ✅";


        } catch (error) {

            console.error(error);

            status.textContent =
                "خطا در پردازش فایل ❌";

        } finally {

            cutButton.disabled =
                false;

            progressBox.classList.add(
                "hidden"
            );

        }

    }
);


function getExtension(name) {

    const index =
        name.lastIndexOf(".");


    if (index === -1)
        return ".bin";


    return name.substring(
        index
    );

}


resetButton.addEventListener(
    "click",
    () => {

        location.reload();

    }
);
