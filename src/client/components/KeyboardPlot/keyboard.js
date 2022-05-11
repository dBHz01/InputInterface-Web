import {
    ClearOutlined, FullscreenExitOutlined, FullscreenOutlined, SettingOutlined,
} from '@ant-design/icons';
import {
    Card, Button, Col, Divider, Drawer, Form, InputNumber, List, notification, Row, Space, Switch,
} from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import io from 'socket.io-client';
import './keyboard.css';
import Layout from './layout';
import { Debugout } from 'debugout.js';

const bugout = new Debugout({ useTimestamps: true });//, realTimeLoggingOn:true });
const START = 1;
const MOVE = 2;
const END = 3;
const EXPLORE = 4;
const getTimestamp = () => {
    return new Date().getTime();
};
let logTime = 0;
const Keyboard = ({ cRef }) => {
    const canvasRef = useRef({ width: 900, height: 450 });
    const sampleSize = 50;
    // const [candidates, setCandidates] = useState([]);
    const isStart = useRef(false);
    const userPath = useRef([]);
    const cursorPos = useRef(null);
    const keyboardParameter = useRef(null);


    const [wordDict, setWordDict] = useState([]);
    // const wordDict = useRef([]);
    const [useMouse, setUseMouse] = useState(false);
    const [showScore, setShowScore] = useState(false);
    const [useRelativeModel, setUseRelativeModel] = useState(true);
    const [useLanguageModel, setUseLanguageModel] = useState(true);
    const [corpusSize, setCorpusSize] = useState(1000);
    const [showSettings, setShowSettings] = useState(false);
    const [keyboardWidth, setKeyboardWidth] = useState(900);
    const [keyboardHeight, setKeyboardHeight] = useState(225);
    const [keyboardPosX, setKeyboardPosX] = useState(0);
    const [keyboardPosY, setKeyboardPosY] = useState(225);
    const [canvasWidth, setCanvasWidth] = useState(900);
    const [canvasHeight, setCanvasHeight] = useState(450);
    const fullScreenHandle = useFullScreenHandle();
    const [inputText, setInputText] = useState('');
    const [q_pos, setQPos] = useState({ x: 0.5 * (0.9 - 0.1) / 10 + 0.1, y: 0.85 });
    const [p_pos, setPPos] = useState({ x: -0.5 * (0.9 - 0.1) / 10 + 0.9, y: 0.85 });
    const [a_pos, setAPos] = useState({ x: 0.5 * (0.8 - 0.2) / 9 + 0.2, y: 0.5 });
    const [l_pos, setLPos] = useState({ x: -0.5 * (0.8 - 0.2) / 9 + 0.8, y: 0.5 });
    const [z_pos, setZPos] = useState({ x: 0.5 * (0.75 - 0.25) / 9 + 0.25, y: 0.15 });
    const [m_pos, setMPos] = useState({ x: -0.5 * (0.75 - 0.25) / 9 + 0.75, y: 0.15 });
    const [candidates, setCandidates] = useState(["", "", "", ""]);
    const [sentence, setSentence] = useState("");
    const [target, setTarget] = useState("");
    const [curStatus, setCurStatus] = useState("wait") // wait, type, or choose

    const layout = useRef(null);
    // const [layout, setLayout] = useState(new Layout({'width': 450, 'height': 225, 'posx': 0, 'posy': 225}));

    useEffect(() => {
        init();
    }, [canvasRef, canvasHeight, canvasWidth]);

    useEffect(() => {
        loadCorpus();
    }, []);



    useEffect(() => {
        const socket = io(`${document.domain}:8080`);
        socket.on('connect', () => {
            console.log('connected!!!');
        });
        socket.on('data', onData);
        return function closeSocket() {
            socket.close();
        };
    }, [corpusSize, wordDict]);


    let onData = (data) => {
        const lines = data.split('\n');
        lines.forEach((element) => {
            const items = element.split(' ');
            switch (items[0]) {
                case 'event':
                    dispatch({ type: 'event', value: { type: parseInt(items[1]), pos: { x: parseFloat(items[2]), y: parseFloat(items[3]) }, norm: true } });
                    break;
                case 'select':
                    dispatch({ type: 'select', value: items[1] });
                    break;
                case 'reshape':
                    dispatch({
                        type: 'reshape',
                        value: {
                            q_pos: { x: parseFloat(items[1]), y: parseFloat(items[2]) },
                            p_pos: { x: parseFloat(items[3]), y: parseFloat(items[4]) },
                            a_pos: { x: parseFloat(items[5]), y: parseFloat(items[6]) },
                            l_pos: { x: parseFloat(items[7]), y: parseFloat(items[8]) },
                            z_pos: { x: parseFloat(items[9]), y: parseFloat(items[10]) },
                            m_pos: { x: parseFloat(items[11]), y: parseFloat(items[12]) },
                        }
                    });
                    break;
                case 'candidates':
                    setCandidates([items[1], items[2], items[3], items[4], items[5]]);
                    bugout.log('candidates ', items[1], items[2], items[3], items[4], items[5]);
                    dispatch({ type: 'candidates', value: { cands: [items[1], items[2], items[3], items[4], items[5]] } });
                    break;
                case 'target':
                    bugout.log('target ', items[1]);
                    setTarget(items[1]);
                    break;
                case 'timestamp':
                    dispatch({ type: 'timestamp', value: items[1] });
                    break;
                case 'status':
                    dispatch({ type: 'status', value: items[1] })
                    break;
                default:
                    break;
            }
        });
    };


    useEffect(() => {
        layout.current = new Layout({
            q_pos: q_pos,
            p_pos: p_pos,
            a_pos: a_pos,
            l_pos: l_pos,
            z_pos: z_pos,
            m_pos: m_pos,
            posx: keyboardPosX,
            posy: keyboardPosY,
            keyboardHeight: keyboardHeight,
            keyboardWidth: keyboardWidth,
            candidates: candidates,
            target: target,
        });
        updateCanvas();
    }, [keyboardHeight, keyboardWidth, keyboardPosX, keyboardPosY, q_pos, p_pos, a_pos, l_pos, z_pos, m_pos, candidates, target]);

    useEffect(() => {
        updateCanvas();
    }, [state]);


    let init = () => {
        const canvas = canvasRef.current;
        // let context = canvas.getContext('2d');
        setKeyboardWidth(canvas.width);
        setKeyboardHeight(canvas.height / 2);
        setKeyboardPosX(0);
        setKeyboardPosY(canvas.height / 2);
        layout.current = new Layout({
            q_pos: q_pos,
            p_pos: p_pos,
            a_pos: a_pos,
            l_pos: l_pos,
            z_pos: z_pos,
            m_pos: m_pos,
            posx: keyboardPosX,
            posy: keyboardPosY,
            keyboardHeight: keyboardHeight,
            keyboardWidth: keyboardWidth,
            candidates: candidates,
            target: target,
        });
        updateCanvas();
    };


    const windowToCanvas = (c, x, y) => {
        const rect = c.getBoundingClientRect();
        const xpos = x - rect.left * (c.width / rect.width);
        const ypos = y - rect.top * (c.height / rect.height);
        return { x: xpos, y: ypos };
    };

    const mouseControl = (type, e) => {
        if (useMouse) {
            const position = windowToCanvas(canvasRef.current, e.clientX, e.clientY);
            dispatch({ type: 'event', value: { type: type, pos: position } });
            //onEvent(type, position);
        }
    };


    const openNotification = (type, content) => {
        notification[type]({
            message: content,
        });
    };


    let loadCorpus = () => {
        fetch('/corpus.txt')
            .then(res => res.text())
            .then((data) => {
                const lineData = data.split('\n');
                const tempDict = [];
                for (let i = 0; i < lineData.length; i++) {
                    const item = lineData[i].split(' ');
                    const word = item[0].trim();
                    const freq = parseInt(item[1]);
                    tempDict.push([word, freq]);
                }
                setWordDict(tempDict);
                setCorpusSize(tempDict.length);
                // wordDict.current = tempDict;
                openNotification('success', '词库加载成功,共有' + tempDict.length + '个词');
            })
            .catch((err) => {
                openNotification('error', `词库加载失败${err}`);
            });
    };

    const getPath = (word) => {
        const ret = [];
        for (const i of word) {
            ret.push(layout.current.getCenter(i));
        }
        return resamplePath(ret);
    };

    let resamplePath = (path) => {
        const n = path.length;
        const ret = [];
        if (n == 1) {
            for (let i = 0; i < sampleSize; i++) {
                ret.push(path[0]);
            }
            return ret;
        }
        let length = 0;
        for (let i = 0; i < n - 1; i++) {
            length += distance(path[i], path[i + 1]);
        }
        const interval = length / (sampleSize - 1);
        let lastPos = path[0];
        let currLen = 0;
        let no = 1;
        ret.push(path[0]);
        while (no < n) {
            const dist = distance(lastPos, path[no]);
            if (currLen + dist >= interval && dist > 0) {
                const ratio = (interval - currLen) / dist;
                const { x, y } = lastPos;
                lastPos = {
                    x: x + ratio * (path[no].x - x),
                    y: y + ratio * (path[no].y - y),
                };
                ret.push(lastPos);
                currLen = 0;
            } else {
                currLen += dist;
                lastPos = path[no];
                no++;
            }
        }
        for (let i = ret.length; i < sampleSize; i++) {
            ret.push(path[n - 1]);
        }
        return ret;
    };

    let distance = (t1, t2) => {
        const dx = t1.x - t2.x;
        const dy = t1.y - t2.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context == null) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (layout.current != null) {
            layout.current.render(context);
        }
        setCandidates([]);
        userPath.current = [];
    };

    let updateCanvas = (s = state) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context === null) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        if (layout.current != null) {
            layout.current.render(context);
        }
        let uPath = s.userPath;
        if (uPath.length > 0) {
            context.moveTo(uPath[0].x, uPath[0].y);
            for (let i = 1; i < uPath.length; i++) {
                context.lineTo(uPath[i].x, uPath[i].y);
            }
            context.stroke();
        }
        if (s.cursorPos !== null) {
            context.beginPath();
            context.arc(s.cursorPos.x, s.cursorPos.y, 5, 0, 2 * Math.PI);
            context.fill();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', (event) => {
            console.log("in key down|" + event.code + "|");
            switch (event.code) {
                case 'ArrowUp':
                    event.preventDefault();
                    dispatch({ type: 'select', value: 'up' });
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    dispatch({ type: 'select', value: 'right' });
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    dispatch({ type: 'select', value: 'down' });
                    return;
                case 'ArrowLeft':
                    event.preventDefault();
                    dispatch({ type: 'select', value: 'left' });
                    return;
                case 'Enter':
                    event.preventDefault();
                    dispatch({ type: 'select', value: 'click' });
                    return;
                case 'Space':
                    event.preventDefault();
                    let timestamp = getTimestamp();
                    bugout.log('timestamp', timestamp)
                    return;
                default:
                    return;
            }
        });
    }, []);

    const logGaussian = (x, mu, sigma) => {
        const ret = -(x - mu) * (x - mu) / 2 / sigma / sigma - Math.log(Math.sqrt(2 * Math.PI)) - Math.log(sigma);
        return ret;
    };

    const calculateLocationProbability = (p1, p2, word) => {
        let ret = 0;
        let alpha = 1 / sampleSize;
        for (let i = 0; i < sampleSize; i++) {
            if (i == 0 || i == sampleSize - 1) {
                alpha = 0.2;
            } else {
                alpha = 0.6 / (sampleSize - 2);
            }
            ret += alpha * logGaussian(p1[i].x - p2[i].x, 0, layout.current.keyWidth * 0.7);
            ret += alpha * logGaussian(p1[i].y - p2[i].y, 0, layout.current.keyHeight * 0.7);
        }
        ret *= sampleSize;
        // ret = ret / sampleSize * word.length;
        return ret;
    };


    const normalizePath = (p) => {
        let minx = Number.MAX_VALUE;
        let maxx = Number.MIN_VALUE;
        let miny = Number.MAX_VALUE;
        let maxy = Number.MIN_VALUE;
        const ret = [];
        let sumx = 0;
        let sumy = 0;
        for (let i = 0; i < p.length; i++) {
            if (p[i].x < minx) minx = p[i].x;
            if (p[i].x > maxx) maxx = p[i].x;
            if (p[i].y < miny) miny = p[i].y;
            if (p[i].y > maxy) maxy = p[i].y;
            sumx += p[i].x;
            sumy += p[i].y;
        }
        let scale = 1;
        if (Math.max(maxx - minx, maxy - miny) > 0) {
            scale = 1 / Math.max(maxx - minx, maxy - miny);
        }
        const center = { x: sumx / p.length, y: sumy / p.length };
        for (let i = 0; i < p.length; i++) {
            ret.push({
                x: (p[i].x - center.x) * scale,
                y: (p[i].y - center.y) * scale,
            });
        }
        return ret;
    };

    let calculateShapeProbability = (p1, p2, word) => {
        let ret = 0;
        const np1 = normalizePath(p1);
        const np2 = normalizePath(p2);
        for (let i = 0; i < sampleSize; i++) {
            ret += logGaussian(np1[i].x - np2[i].x, 0, 0.3);
            ret += logGaussian(np1[i].y - np2[i].y, 0, 0.3);
        }
        // ret = ret / sampleSize * word.length;
        return ret;
    };

    const calculateCandidate = (path) => {
        const userP = resamplePath(path);
        const ans = [];
        for (let i = 0; i < corpusSize; i++) {
            const ele = wordDict[i];
            // console.log(ele);
            const word = ele[0];
            const freq = ele[1];
            const path = getPath(word);
            // let dis = similarity(userP, path);
            const locationScore = calculateLocationProbability(userP, path, word);
            const shapeScore = calculateShapeProbability(userP, path, word);
            let pro = locationScore;
            if (useLanguageModel) {
                pro += Math.log(freq);
            }
            if (useRelativeModel) {
                pro += shapeScore;
            }
            ans.push([word, pro, locationScore, shapeScore, Math.log(freq)]);
        }
        ans.sort((a, b) => b[1] - a[1]);
        // console.log(ans);
        // setCandidates(ans.slice(0, 5));
        return ans.slice(0, 5);
    };

    const reducer = (state, action) => {
        if (action.type === 'select') {
            if (action.value.length == 0) return state;
            bugout.log(action.value, new Date().getTime());
            let lastSentence = sentence;
            setCandidates(["", "", "", ""])
            switch (action.value) {
                case 'click':
                case 'up':
                    setSentence(lastSentence + " " + state.candidates[0]);
                    bugout.log(state.candidates.length > 0 ? state.candidates[0] : '');
                    if (state.candidates[0] == target) {
                        bugout.log("true");
                    } else {
                        bugout.log("false");
                    }
                    return {
                        ...state,
                        text: state.candidates.length > 0 ? state.candidates[0] : '',
                    };
                case 'right':
                    setSentence(lastSentence + " " + state.candidates[1]);
                    bugout.log(state.candidates.length > 1 ? state.candidates[1] : '');
                    if (state.candidates[1] == target) {
                        bugout.log("true");
                    } else {
                        bugout.log("false");
                    }
                    return {
                        ...state,
                        text: state.candidates.length > 1 ? state.candidates[1] : '',
                    };
                case 'down':
                    setSentence(lastSentence + " " + state.candidates[2]);
                    bugout.log(state.candidates.length > 2 ? state.candidates[2] : '');
                    if (state.candidates[2] == target) {
                        bugout.log("true");
                    } else {
                        bugout.log("false");
                    }
                    return {
                        ...state,
                        text: state.candidates.length > 2 ? state.candidates[2] : '',
                    };
                case 'left':
                    setSentence(lastSentence + " " + state.candidates[3]);
                    bugout.log(state.candidates.length > 3 ? state.candidates[3] : '');
                    if (state.candidates[3] == target) {
                        bugout.log("true");
                    } else {
                        bugout.log("false");
                    }
                    return {
                        ...state,
                        text: state.candidates.length > 3 ? state.candidates[3] : '',
                    };
                default:
                    return state;
            }
        } else if (action.type === 'event') {
            let type = action.value.type;
            let pos = { x: action.value.pos.x, y: action.value.pos.y };
            let normalized = action.value.norm;
            if (type != START && type != MOVE && type != EXPLORE && type != END) { return; }
            if (normalized) {
                // pos.x *= canvasRef.current.width;
                // pos.y *= canvasRef.current.height;
                pos.y = 1 - pos.y;
                pos.x *= keyboardWidth;
                pos.y *= keyboardHeight;
                pos.y += canvasRef.current.height - keyboardHeight;
            }
            let timestamp = getTimestamp();
            //cursorPos.current = pos;
            let newState = state;
            switch (type) {
                case START:
                    bugout.log('start', timestamp);
                    newState = {
                        ...state,
                        cursorPos: pos,
                        userPath: [pos],
                        isStart: true,
                        //candidates: [],
                        logTime: timestamp
                    };
                    break;
                case MOVE:
                case EXPLORE:
                    if (state.isStart) {
                        newState = {
                            ...state,
                            cursorPos: pos,
                            userPath: [...state.userPath, pos]
                        }
                    } else {
                        newState = {
                            ...state,
                            cursorPos: pos
                        }
                    }
                    break;
                case END:
                    bugout.log('end', timestamp);
                    // if (state.isStart) {
                    //     bugout.log('interval,' + (timestamp - state.logTime));
                    //     let path = [...state.userPath, pos];
                    //     let cands = calculateCandidate(path);
                    //     newState = {
                    //         ...state,
                    //         cursorPos: pos,
                    //         candidates: cands,
                    //         text: cands.length > 0 ? cands[0] : '',
                    //         userPath: path,
                    //         isStart: false
                    //     }
                    // } else {
                    //     newState = {
                    //         ...state,
                    //         cursorPos: pos,
                    //         isStart: false
                    //     }
                    // }
                    newState = {
                        ...state,
                        cursorPos: pos,
                        isStart: false,
                    }
                    break;
                default:
                    return state;
            }
            updateCanvas(newState);
            return newState;
        } else if (action.type === 'reshape') {
            setQPos(action.value.q_pos);
            setPPos(action.value.p_pos);
            setAPos(action.value.a_pos);
            setLPos(action.value.l_pos);
            setZPos(action.value.z_pos);
            setMPos(action.value.m_pos);
        } else if (action.type === 'candidates') {
            let newState = state;
            newState = {
                ...state,
                candidates: action.value.cands,
                text: action.value.cands.length > 0 ? action.value.cands[0] : '',
            }
            return newState;
        } else if (action.type === 'timestamp') {
            bugout.log(action.value, new Date().getTime());
        } else if (action.type === 'status') {
            setCurStatus(action.value);
        }
        return state;
    };
    const [state, dispatch] = useReducer(reducer, { candidates: [], userPath: [], logTime: 0, text: '', isStart: false, cursorPos: null });




    const settingsExtra = () => (
        <Space>
            <SettingOutlined onClick={event => setShowSettings(true)} />
            <ClearOutlined onClick={event => clearCanvas()} />
            {fullScreenHandle.active
                ? <FullscreenExitOutlined onClick={fullScreenHandle.exit} />
                : <FullscreenOutlined onClick={fullScreenHandle.enter} />
            }
        </Space>
    );

    const settingsClosed = () => {
        setShowSettings(false);
    };

    const formLayout = {
        labelCol: {
            span: 8,
        },
        wrapperCol: {
            span: 16,
        },
        labelAlign: 'left',
    };

    return (
        <div>
            <FullScreen handle={fullScreenHandle}>
                <Card title="Gesture Keyboard" extra={settingsExtra()} style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
                    <Button onClick={e => { bugout.downloadLog() }}>Download Log</Button>
                    <h3>当前状态: {curStatus === 'wait' ? "等待输入，请松开压力" : (curStatus === 'type' ? "正在输入" : "请选择单词")}</h3>
                    {/* <h3>下一个单词: {target}</h3> */}
                    {/* <h3>输入单词: {state.text}</h3> */}
                    {/* <h3>输入句子: {sentence}</h3> */}
                    <Row style={{ textAlign: 'center', height: '100%'}} justify="center" align="middle">
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>输入句子: {sentence}</h3>
                    </Row>
                    <Row style={{ textAlign: 'center', height: '100%'}} justify="center" align="middle">
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>待输入单词: {target}</h3>
                    </Row>
                    <Row style={{ textAlign: 'center', height: '100%' }} justify="center" align="middle">
                        <Col flex={2} sm={24}>
                            <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} data={state.candidates.length > 0 ? [state.candidates[0], state.candidates[1], state.candidates[2], state.candidates[3]] : []} onMouseDown={e => mouseControl(START, e)} onMouseMove={e => mouseControl(MOVE, e)} onMouseUp={e => mouseControl(END, e)}>
                            </canvas>
                            {/* <canvas ref={canvasRef} width="450" height="450"/> */}
                        </Col>
                    </Row>
                    <Drawer
                        visible={showSettings}
                        onClose={settingsClosed}
                        width={720}
                        title="键盘设置"
                    >
                        <Form.Item layout="horizontal" {...formLayout}>
                            <Form.Item label="词库大小(1000-30000)">
                                <InputNumber style={{ width: '100%' }} min={1000} max={30000} step={1000} onChange={v => setCorpusSize(v)} value={corpusSize} />
                            </Form.Item>
                            <Form.Item label="绑定鼠标事件">
                                <Switch checked={useMouse} onChange={v => setUseMouse(v)} />
                            </Form.Item>
                            <Form.Item label="使用相对位置信息">
                                <Switch checked={useRelativeModel} onChange={v => setUseRelativeModel(v)} />
                            </Form.Item>
                            <Form.Item label="使用语言模型">
                                <Switch checked={useLanguageModel} onChange={v => setUseLanguageModel(v)} />
                            </Form.Item>
                            <Form.Item label="显示匹配结果">
                                <Switch checked={showScore} onChange={v => setShowScore(v)} />
                            </Form.Item>
                            <Divider>键盘参数</Divider>
                            <Form.Item label="输入区域大小">
                                <Row gutter={16}>
                                    <Col flex={1}>
                                        <Form.Item label="宽(0-1000)" layout="horizontal">
                                            <InputNumber min={0} max={1000} onChange={v => setCanvasWidth(v)} value={canvasWidth} />
                                        </Form.Item>
                                    </Col>

                                    <Col flex={1}>
                                        <Form.Item label="高(0-1000)" layout="horizontal">
                                            <InputNumber min={0} max={1000} onChange={v => setCanvasHeight(v)} value={canvasHeight} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form.Item>

                            <Form.Item label="键盘大小">
                                <Row gutter={16}>
                                    <Col flex={1}>
                                        <Form.Item label="宽" layout="horizontal">
                                            <InputNumber style={{ width: '100%' }} min={0} max={canvasRef.current.width} onChange={v => setKeyboardWidth(v)} value={keyboardWidth} />
                                        </Form.Item>
                                    </Col>

                                    <Col flex={1}>
                                        <Form.Item label="高" layout="horizontal">
                                            <InputNumber style={{ width: '100%' }} min={0} max={canvasRef.current.height} onChange={v => setKeyboardHeight(v)} value={keyboardHeight} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form.Item>
                            <Form.Item label="键盘位置（左上角）">
                                <Row gutter={16}>
                                    <Col flex={1}>
                                        <Form.Item label="X" layout="horizontal">
                                            <InputNumber style={{ width: '100%' }} min={0} max={canvasRef.current.width - keyboardWidth} onChange={v => setKeyboardPosX(v)} value={keyboardPosX} />
                                        </Form.Item>
                                    </Col>

                                    <Col flex={1}>
                                        <Form.Item label="Y" layout="horizontal">
                                            <InputNumber style={{ width: '100%' }} min={0} max={canvasRef.current.height - keyboardHeight} onChange={v => setKeyboardPosY(v)} value={keyboardPosY} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form.Item>
                        </Form.Item>
                    </Drawer>
                </Card>
            </FullScreen>

            {/* <Card title="Log" style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
                    <Row style={{ textAlign: 'center', height: '100%' }} justify="center" align="middle">
                        <pre>
                            {bugout.getLog()}
                        </pre>
                    </Row>
                </Card> */}
        </div>
    );
};

export default Keyboard;
