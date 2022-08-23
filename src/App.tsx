import { useState, useRef, useEffect } from 'react';
import ReactHtmlParser from 'html-react-parser';
// @ts-ignore
import getSvgoInstance from 'svgo-browser/lib/get-svgo-instance';
import exampleSvg from './assets/example.svg?raw';

// everything included in default configuration
const svgo = getSvgoInstance({
    removeDimensions: false,
});

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const download = (str: string) => {
    const file = new File([str], 'optimised.svg', {
        type: 'text/plain',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export default function App() {
    const svgStrRef = useRef<HTMLInputElement>(null);
    const svgCountRef = useRef<HTMLInputElement>(null);
    const svgRenderMethodRef = useRef<HTMLSelectElement>(null);
    const svgSvgoRef = useRef<HTMLSelectElement>(null);
    const optimisedFile = useRef<string>('');
    const [svgs, setSvgs] = useState<React.ReactNode>();
    const [lastRenderTime, setLastRenderTime] = useState<number>(0);

    const startTime = performance.now();

    useEffect(() => {
        if (!svgs) return;
        const endTime = performance.now();
        setLastRenderTime(endTime - startTime);
        // console.log("Time:", endTime - startTime);
    }, [svgs]);

    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
        const svgStrOriginal = svgStrRef.current!.value;
        const svgCount = parseInt(svgCountRef.current!.value) || 1;
        const svgRenderMethod = svgRenderMethodRef.current!.value;
        const svgSvgo = svgSvgoRef.current!.value;

        const svgStr =
            svgSvgo === 'optimise'
                ? ((await svgo
                      .optimize(svgStrOriginal)
                      .then(({ data }: { data: string }) => data)) as string)
                : svgStrOriginal;

        optimisedFile.current = svgStr;

        let nextDivs = [];
        const element = ReactHtmlParser(svgStr);
        const encodedSvg = encodeURIComponent(svgStr);

        for (let i = 0; i < svgCount; i++) {
            switch (svgRenderMethod) {
                case 'dangerous':
                    nextDivs.push(
                        <span
                            key={`${Date.now()}${i}`}
                            dangerouslySetInnerHTML={{ __html: svgStr }}
                        />
                    );
                    break;

                case 'jsx':
                    nextDivs.push(
                        <span key={`${Date.now()}${i}`}>{element}</span>
                    );
                    break;

                case 'img':
                    nextDivs.push(
                        <img
                            key={`${Date.now()}${i}`}
                            src={`data:image/svg+xml;utf8,${encodedSvg}`}
                        />
                    );
                    break;
            }
        }
        setSvgs(nextDivs);
    };

    return (
        <div className="h-full flex flex-col divide-y">
            <form
                className="flex-none p-4 flex gap-4 bg-slate-100 text-gray-700"
                onSubmit={handleSubmit}
            >
                <label className="flex-auto">
                    <span>SVG:</span>
                    <input
                        ref={svgStrRef}
                        required
                        className="block rounded-md border-gray-300 shadow-sm w-full"
                        type="text"
                        defaultValue={
                            import.meta.env.PROD ? undefined : exampleSvg
                        }
                        placeholder="Paste SVG contents..."
                    />
                </label>

                <label>
                    <span>Count:</span>
                    <input
                        ref={svgCountRef}
                        className="block rounded-md border-gray-300 shadow-sm"
                        type="number"
                        defaultValue={100}
                        min={1}
                        max={1000}
                    />
                </label>
                <label>
                    <span>SVGO:</span>
                    <select
                        ref={svgSvgoRef}
                        className="block rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="off">Off</option>
                        <option value="optimise">Optimise</option>
                    </select>
                </label>
                <label>
                    <span>Render method:</span>
                    <select
                        ref={svgRenderMethodRef}
                        className="block rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="dangerous">
                            dangerouslySetInnerHTML
                        </option>
                        <option value="jsx">JSX</option>
                        <option value="img">Img (Data URI)</option>
                    </select>
                </label>
                <button
                    className="ml-auto rounded-md bg-teal-600 text-white px-8 h-10 self-end hover:bg-teal-700 active:bg-teal-800"
                    type="submit"
                >
                    Render
                </button>
            </form>
            <div className="flex-auto p-4 overflow-y-auto">{svgs}</div>
            <div className="flex-none p-4 bg-slate-100 flex place-content-between">
                <div>
                    Render time: {Math.round(lastRenderTime * 100) / 100}ms
                </div>
                {svgSvgoRef.current?.value === 'optimise' && (
                    <div>
                        Optimised file size:{' '}
                        {formatBytes(
                            new Blob([svgStrRef.current?.value ?? '']).size
                        )}{' '}
                        → {formatBytes(new Blob([optimisedFile.current]).size)}.{' '}
                        <a
                            href="#"
                            className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                            onClick={(e) => {
                                e.preventDefault();
                                download(optimisedFile.current);
                            }}
                        >
                            Download
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
