import { FullscreenExitOutlined, FullscreenOutlined, SettingOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Drawer, Form, Row, Space, List, Button, InputNumber } from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useState, useReducer } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import io from 'socket.io-client';
import PressureBar from './PressureBar';



const PressureTest = (props) => {
    const [level, setLevel] = useState(200);
    const [range, setRange] = useState(1.0);
    const [jittor, setJittor] = useState(0.05);
    const [maxforceTime, setMaxforceTime] = useState(5000);
    const [target, setTarget] = useState(50);
    const [timeLeft, setTimeLeft] = useState(5);
    const [curStatus, setCurStatus] = useState("wait") // wait, press, or end

    const setRate = ((target, value) => {
        setLevel(value);
        setTarget(target);
    })

    useEffect(() => {
        window.addEventListener('keydown', (event) => {
            console.log("in key down|" + event.code + "|");
            switch (event.code) {
                case 'ArrowLeft':
                    event.preventDefault();
                    dispatch('di');
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    dispatch('da');
                    return;
                case 'Space':
                    event.preventDefault();
                    dispatch('space');
                    return;
                case 'Escape':
                    event.preventDefault();
                    dispatch('reset');
                    return;
                default:
                    return;
            }
        });
    }, []);

    const reducer = (state, action) => {
        // console.log('in reducer');
        // console.log(state);
        // console.log(action);
        let timeStamp = new Date().getTime();
        switch (action.type) {
            case 'pressure':
                if (isNaN(action.value)) return state;
                // if (state.status === 'maxforce') {
                //     let lastV = state.lastPressure;
                //     if (Math.abs(action.value - lastV) < jittor) {
                //         let time = timeStamp - state.lastTime;
                //         if (time > maxforceTime) {
                //             return {
                //                 ...state,
                //                 status: '',
                //                 maxForce: Math.max(state.lastPressure, action.value)
                //             }
                //         } else {
                //             return {
                //                 ...state,
                //                 lastPressure: Math.max(state.lastPressure, action.value),
                //                 value: action.value
                //             }
                //         }
                //     } else { // not stable
                //         return {
                //             ...state,
                //             lastPressure: action.value,
                //             lastTime: timeStamp,
                //             value: action.value
                //         }
                //     }
                // } else { // not in maxforce test
                return {
                    ...state,
                    value: action.value
                };
            // }
            case 'maxforce':
                console.log("maxforce");
                return {
                    ...state,
                    status: 'maxforce',
                    maxForce: action.value
                }
            default:
                return state;

        }
    };
    const [state, dispatch] = useReducer(reducer, { status: '', value: 0.0, maxForce: null });

    useEffect(() => {
        console.log("trying to connect to " + document.domain + ':8080');
        const socket = io(document.domain + ':8080');
        socket.on('connect', () => {
            console.log(document.domain + ':8080' + 'connected!!');
        });
        socket.on('data', function (data) {
            let lines = data.split('\n');
            lines.forEach(element => {
                const items = element.split(' ');
                console.log(items)
                switch (items[0]) {
                    case 'pressure':
                        dispatch({ type: 'pressure', value: parseFloat(items[1]) });
                        break;
                    case 'maxforce':
                        dispatch({ type: 'maxforce', value: parseFloat(items[1]) });
                        break;
                    case 'rate':
                        setRate(parseInt(items[1]), parseInt(items[2]));
                        break;
                    case 'timeleft':
                        setTimeLeft(parseInt(items[1]));
                        break;
                    case 'status':
                        setCurStatus(items[1]);
                    default:
                        break;
                }
            });
        });
        return function closeSocket() {
            socket.close();
        }
    }, []);

    const testMaxForce = (event) => {
        dispatch({ type: 'maxforce' });
    }

    const testForceResolution = (event) => {
        dispatch({ type: 'resolution' });
    }




    const [showSettings, setShowSettings] = useState(false);
    const fullScreenHandle = useFullScreenHandle();




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

    const bindingsData = [
        {
            key: '←',
            function: 'Di/·'
        },
        {
            key: '→',
            function: 'Da/-'
        },
        {
            key: 'Space',
            function: 'Confirm/Space'
        },
        {
            key: 'ESC',
            function: 'Cancel/Clear'
        }
    ];




    return (
        <FullScreen handle={fullScreenHandle}>
            <Card title="Pressure Test" extra={settingsExtra()} style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
                <h1>当前状态: {curStatus === 'wait' ? "等待输入，施加压力到标准值后保持" : (curStatus === 'press' ? "请保持压力直到时间结束" : "请松开压力")}</h1>
                <h1>剩余时间: {timeLeft} 秒</h1>
                <Form layout='inline'>
                    <Form.Item layout="inline">

                        <Form.Item label="分级">
                            <InputNumber min={2} max={30000} step={1} onChange={v => setLevel(v)} value={level} />
                        </Form.Item>
                        <Form.Item label="目标">
                            <InputNumber min={0} max={level - 1} step={1} onChange={v => setTarget(v)} value={target} />
                        </Form.Item>
                    </Form.Item>
                </Form>

                <Divider>Max Force : {state.maxForce === null ? '?' : state.maxForce}</Divider>
                <Divider>Pressure:</Divider>
                <Row>
                    <PressureBar steps={level} target={target} percent={state.value * 100 / range} />
                </Row>
                <Drawer
                    visible={showSettings}
                    onClose={settingsClosed}
                    width={720}
                    title='设置'>
                    <Form layout='horizontal' {...formLayout}>
                        <Form.Item layout="horizontal" {...formLayout}>
                            <Form.Item label="压力最大可能值">
                                <InputNumber
                                    style={{ width: '100%' }}
                                    defaultValue="1"
                                    min="0"
                                    max="1000"
                                    step="0.01"
                                    value={range}
                                    onChange={v => setRange(v)}
                                    stringMode
                                />
                            </Form.Item>
                            <Form.Item label="压力平稳抖动阈值">
                                <InputNumber
                                    style={{ width: '100%' }}
                                    defaultValue="0.05"
                                    min="0"
                                    max="1000"
                                    step="0.01"
                                    value={jittor}
                                    onChange={v => setJittor(v)}
                                    stringMode
                                />
                            </Form.Item>
                            <Form.Item label="压力保持不变时长阀值(ms)">
                                <InputNumber style={{ width: '100%' }} min={100} max={30000} step={1000} onChange={v => setMaxforceTime(v)} value={maxforceTime} />
                            </Form.Item>

                            {/* <InputNumber style={{ width: '100%' }} min={1000} max={30000} step={1000} onChange={v => setCorpusSize(v)} value={corpusSize} />
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
                            </Form.Item> */}
                        </Form.Item>
                    </Form>
                </Drawer>
            </Card>
        </FullScreen>
    );
}

export default PressureTest;
