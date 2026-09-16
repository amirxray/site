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


let file = null;

let media = null;

let duration = 0;


fileInput.addEventListener(
    "change",
    function () {

        if (!this.files.length)
            return;

        loadFile(this.files[0]);

    }
);


function loadFile(selectedFile) {

    file = selectedFile;

    const url =
        URL.createObjectURL(file);


    fileName.textContent =
        file.name;


    if (file.type.startsWith("video/")) {

        video.classList.remove("hidden");

        audio.classList.add("hidden");

        video.src = url;

        media = video;

    } else {

        audio.classList.remove("hidden");

        video.classList.add("hidden");

        audio.src = url;

        media = audio;

    }


    media.onloadedmetadata =
        function () {

            duration =
                media.duration;


            start.value = 0;

            end.value =
                duration.toFixed(1);


            startRange.max =
                duration;

            endRange.max =
                duration;


            startRange.value = 0;

            endRange.value =
                duration;


            editor.classList.remove("hidden");


            status.textContent =
                "فایل آماده برش است.";

        };

}


startRange.addEventListener(
    "input",
    function () {

        start.value =
            this.value;

    }
);


endRange.addEventListener(
    "input",
    function () {

        end.value =
            this.value;

    }
);


start.addEventListener(
    "input",
    function () {

        startRange.value =
            this.value;

    }
);


end.addEventListener(
    "input",
    function () {

        endRange.value =
            this.value;

    }
);


cutButton.addEventListener(
    "click",
    async function () {

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
                "زمان شروع و پایان را درست وارد کنید.";

            return;

        }


        status.textContent =
            "در حال آماده‌سازی برش...";


        try {

            const result =
                await cutMedia(
                    media,
                    startTime,
                    endTime
                );


            const url =
                URL.createObjectURL(result);


            download.href =
                url;


            download.download =
                "amirxray-cut.webm";


            download.classList.remove(
                "hidden"
            );


            status.textContent =
                "برش با موفقیت انجام شد ✅";


        } catch (error) {

            console.error(error);


            status.textContent =
                "مرورگر شما امکان برش این فایل را ندارد.";

        }

    }
);


async function cutMedia(
    element,
    startTime,
    endTime
) {

    const stream =
        element.captureStream();


    if (!stream) {

        throw new Error(
            "captureStream not supported"
        );

    }


    let mimeType;


    if (
        element.tagName === "VIDEO"
    ) {

        mimeType =
            "video/webm";

    } else {

        mimeType =
            "audio/webm";

    }


    const recorder =
        new MediaRecorder(
            stream,
            {
                mimeType: mimeType
            }
        );


    const chunks = [];


    recorder.ondataavailable =
        function (event) {

            if (event.data.size > 0) {

                chunks.push(
                    event.data
                );

            }

        };


    element.currentTime =
        startTime;


    await new Promise(
        resolve => {

            element.onseeked =
                resolve;

        }
    );


    return new Promise(
        async resolve => {

            recorder.onstop =
                function () {

                    resolve(
                        new Blob(
                            chunks,
                            {
                                type: mimeType
                            }
                        )
                    );

                };


            recorder.start();


            await element.play();


            setTimeout(
                function () {

                    element.pause();

                    recorder.stop();

                },
                (endTime - startTime) * 1000
            );

        }
    );

}


resetButton.addEventListener(
    "click",
    function () {

        location.reload();

    }
);
