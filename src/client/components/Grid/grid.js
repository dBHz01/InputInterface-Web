import { FullscreenExitOutlined, FullscreenOutlined, SettingOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Drawer, Form, InputNumber, Row, Space, Switch, Button } from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import io from 'socket.io-client';
import { Debugout } from 'debugout.js';

const bugout = new Debugout({ useTimestamps: true, realTimeLoggingOn: true });


const Grid = (props) => {
    const canvasRef = useRef({ 'width': 450, 'height': 450 });
    //const cursorPos = useRef(null);
    const [showSettings, setShowSettings] = useState(false);
    const [useMouse, setUseMouse] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(450);
    const [canvasHeight, setCanvasHeight] = useState(450);
    const [row, setRow] = useState(10);
    const [col, setCol] = useState(10);
    const fullScreenHandle = useFullScreenHandle();
    const [hasTarget, setHasTarget] = useState(false);
    const [target, setTarget] = useState({ x: -1, y: -1 });
    const [targetSize, setTargetSize] = useState(1);

    const [reached, setReached] = useState(false);
    const [lastTime, setLasttime] = useState(0);
    const [holdTime, setHoldTime] = useState(0);
    const [logOutput, setLogoutput] = useState('');

    const reducer = (state, action) => {
        let xindex = Math.floor(action.x / canvasRef.current.width * col);
        let yindex = Math.floor(action.y / canvasRef.current.height * row);
        if (xindex >= col) xindex = col - 1;
        if (yindex >= row) yindex = row - 1;
        // console.log(xindex, yindex);
        return {
            ...state,
            cursorPos: { x: xindex, y: yindex }
        }
    };
    const [state, dispatch] = useReducer(reducer, { cursorPos: { x: -1, y: -1 } });


    const updateCanvas = (pos) => {
        // console.log('update canvas:', state.cursorPos.x, state.cursorPos.y);
        if (pos === undefined) {
            pos = state.cursorPos;
        }
        let canvas = canvasRef.current;
        let context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        for (let i = 0; i < row - 1; i++) {
            context.moveTo(0, (i + 1) * canvas.height / row);
            context.lineTo(canvas.width, (i + 1) * canvas.height / row);
        }
        for (let i = 0; i < col - 1; i++) {
            context.moveTo((i + 1) * canvas.width / col, 0);
            context.lineTo((i + 1) * canvas.width / col, canvas.height);
        }
        context.stroke();
        let targetX = -1;
        let targetY = -1;
        if (hasTarget) {
            targetX = target.x;
            targetY = target.y;
            context.fillStyle = '#FFE194';
            for (let i = 0; i < row; i++) {
                for (let j = 0; j < col; j++) {
                    if (Math.abs(i - targetX) < targetSize && Math.abs(j - targetY) < targetSize) {
                        context.fillRect(i * canvas.width / col, j * canvas.height / row, canvas.width / col, canvas.height / row);
                    }
                }
            }
            context.fillStyle = '#FFA900';
            context.fillRect(targetX * canvas.width / col, targetY * canvas.height / row, canvas.width / col, canvas.height / row);
        }
        
        if (state.cursorPos != null) {
            let xindex = pos.x;
            let yindex = pos.y;
            // console.log(xindex, yindex, Math.abs(xindex - targetX), Math.abs(yindex - targetY))
            if (hasTarget && Math.abs(xindex - targetX) < targetSize && Math.abs(yindex - targetY) < targetSize) {
                context.fillStyle = '#52c41a'
                let timeStamp = new Date().getTime();
                console.log(timeStamp - holdTime)
                if (!reached) {
                    setHoldTime(0);
                    //setLogoutput(bugout.getLog());
                    setReached(true);
                } else {
                    if (holdTime == 0) {
                        setHoldTime(timeStamp);
                    } else {
                        if (timeStamp - holdTime > 300) {
                            bugout.log('reach', timeStamp);
                            bugout.log('time', timeStamp - lastTime);
                            setHoldTime(0);
                            setRandomTarget();
                        }
                    }
                }
            } else {
                setReached(false);
                context.fillStyle = '#000000';
            }
            context.fillRect(xindex * canvas.width / col, yindex * canvas.height / row, canvas.width / col, canvas.height / row);
        }

    }


    // let socket;
    useEffect(() => {
        console.log("trying to connect to " + document.domain + ':8080');
        const socket = io(document.domain + ':8080');
        socket.on('connect', () => {
            console.log(document.domain + ':8080' + 'connected!!');
        });
        socket.on('data', function (data) {
            let lines = data.split('\n');
            lines.forEach(element => {
                let items = element.split(' ');
                if (items.length > 1) {
                    dispatch({ x: parseFloat(items[1]) * canvasRef.current.width, y: parseFloat(items[2]) * canvasRef.current.height })
                    // cursorPos.current = {x: parseFloat(items[1])*canvasRef.current.width, y: parseFloat(items[2])*canvasRef.current.height};
                    // updateCanvas();
                }
            });
        });

        window.addEventListener('keydown', (event) => {
            console.log("in key down|" + event.code + "|");
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    let timeStamp = new Date().getTime();
                    bugout.log('timeStamp', timeStamp);
                    //setLogoutput(bugout.getLog());
                    return;
                default:
                    return;
            }
        });
        updateCanvas();
        return function closeSocket() {
            socket.close();
        }


    }, []);

    useEffect(() => {
        // if (!socket.connected) {

        // }
        updateCanvas();
    }, [state, canvasRef, canvasHeight, canvasWidth, row, col, target, hasTarget, targetSize]);

    let mouseMove = (e) => {
        if (useMouse) {
            let position = windowToCanvas(canvasRef.current, e.clientX, e.clientY);
            dispatch(position);
            updateCanvas();
        }
    }

    let windowToCanvas = (c, x, y) => {
        let rect = c.getBoundingClientRect()
        let xpos = x - rect.left * (c.width / rect.width);
        let ypos = y - rect.top * (c.height / rect.height);
        return { x: xpos, y: ypos };
    }

    let settingsExtra = () => (
        <Space>
            <SettingOutlined onClick={event => setShowSettings(true)} />
            {fullScreenHandle.active
                ? <FullscreenExitOutlined onClick={fullScreenHandle.exit} />
                : <FullscreenOutlined onClick={fullScreenHandle.enter} />
            }
        </Space>
    );

    let settingsClosed = () => {
        setShowSettings(false);
    }

    const formLayout = {
        labelCol: {
            span: 8,
        },
        wrapperCol: {
            span: 16,
        },
        labelAlign: 'left'
    };

    const setRandomTarget = () => {
        let targetX = Math.floor(Math.random() * row);
        let targetY = Math.floor(Math.random() * col);
        setTarget({ x: targetX, y: targetY });
        let timeStamp = new Date().getTime();
        bugout.log('setTarget', timeStamp);
        //setLogoutput(bugout.getLog());
        setLasttime(timeStamp);
        setReached(false);
    }

    const switchChange = (v) => {
        setHasTarget(v);
        setRandomTarget();
    }



    return (
        <FullScreen handle={fullScreenHandle}>
            <Card title="Cursor Pad" extra={settingsExtra()} style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
                <Row>
                    <Col span={4}>
                        <Switch checked={hasTarget} checkedChildren="有目标" unCheckedChildren="无目标" onClick={v => switchChange(v)} />
                    </Col>
                    <Col span={4}>
                        <Button disabled={!hasTarget} onClick={e => setRandomTarget()}>Set Random Target</Button>
                    </Col>
                </Row>
                <Row>
                    <Button onClick={e => { bugout.downloadLog() }}>Download Log</Button>
                </Row>

                <Row style={{ textAlign: 'center', height: '100%' }} justify="center" align="middle">
                    <Col flex="1">
                        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} onMouseMove={mouseMove} />
                    </Col>
                </Row>
                <Drawer
                    visible={showSettings}
                    onClose={settingsClosed}
                    width={720}
                    title='设置'>
                    <Form layout='horizontal' {...formLayout}>
                        <Form.Item label="绑定鼠标事件">
                            <Switch checked={useMouse} onChange={v => setUseMouse(v)} />
                        </Form.Item>
                        <Divider>参数</Divider>
                        <Form.Item label="输入区域大小">
                            <Row gutter={16}>
                                <Col flex={1}>
                                    <Form.Item label="宽(0-1000)" layout='horizontal'>
                                        <InputNumber min={0} max={1000} onChange={v => setCanvasWidth(v)} value={canvasWidth} />
                                    </Form.Item>
                                </Col>

                                <Col flex={1}>
                                    <Form.Item label="高(0-1000)" layout='horizontal'>
                                        <InputNumber min={0} max={1000} onChange={v => setCanvasHeight(v)} value={canvasHeight} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>

                        <Form.Item label="行列数">
                            <Row gutter={16}>
                                <Col flex={1}>
                                    <Form.Item label="行" layout='horizontal'>
                                        <InputNumber style={{ 'width': '100%' }} min={0} max={canvasRef.current.height} onChange={v => setRow(v)} value={row} />
                                    </Form.Item>
                                </Col>

                                <Col flex={1}>
                                    <Form.Item label="列" layout='horizontal'>
                                        <InputNumber style={{ 'width': '100%' }} min={0} max={canvasRef.current.width} onChange={v => setCol(v)} value={col} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>
                        <Form.Item label="目标大小" layout='horizontal'>
                            <InputNumber style={{ 'width': '100%' }} min={1} max={Math.min(row, col)} onChange={v => setTargetSize(v)} value={targetSize} />
                        </Form.Item>
                    </Form>
                </Drawer>
            </Card>
            {/* <Card title="Cursor Pad" style={{height: '100%'}} bodyStyle={{height: '100%'}}>
      <Button onClick={e=>{bugout.clear();setLogoutput(bugout.getLog());}}>Clear Log</Button>
          <pre>{logOutput}</pre>
      </Card> */}
        </FullScreen>
    );
}

export default Grid;