/* eslint-disable no-shadow */
import {
    Avatar, Button, Card, Col, Divider, Row, Space, Drawer, Form, InputNumber, Switch
} from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useEffect, useReducer, useState } from 'react';
import './gloves.css';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import io from 'socket.io-client';

let taskTimeout = null;
// let config = {
//     row: 3,
//     col: 3,
//     labels: ['主风机', '主泵', '主通信机', '照明', '+', '摄像', '副风机', '副泵', '备通信机'],
//     initPos: [1, 1],
//     duration: 2000,
//     t2: 10000,
//     taskNum: 10,
//     tasks: null
// };
const initialState = {
    pos: [0, 0],
    currTask: -1,
    click: false
};



const Gloves = () => {
    const [config, setConfig] = useState({
        row: 3,
        col: 3,
        labels: ['主风机', '主泵', '主通信机', '照明', '+', '摄像', '副风机', '副泵', '备通信机'],
        initPos: [1, 1],
        duration: 2000,
        t2: 10000,
        taskNum: 10,
        tasks: null
    });
    const [showSettings, setShowSettings] = useState(false);
    const fullScreenHandle = useFullScreenHandle();
    const formLayout = {
        labelCol: {
            span: 8,
        },
        wrapperCol: {
            span: 16,
        },
        labelAlign: 'left'
    };

    const generateTask = () => {
        let tasks = [];
        if (config.tasks) {
            [tasks] = config.tasks;
        }
        while (tasks.length < config.taskNum) {
            const no = Math.floor(Math.random() * config.labels.length);
            if (no !== config.initPos[0] * config.col + config.initPos[1]) {
                tasks.push(config.labels[no]);
            }
        }
        return tasks;
    };

    const move = (s, dx, dy) => {
        return [(s.pos[0] + dx + config.row) % config.row, (s.pos[1] + dy + config.col) % config.col];
    };
    const reducer = (state, action) => {
        switch (action) {
            case 'start':
                if (state.currTask !== -1 && state.currTask !== config.taskNum) { return state; }
                clearTimeout(taskTimeout);
                taskTimeout = setTimeout(() => dispatch('next'), config.t2);
                return {
                    ...state,
                    currTask: 0,
                    tasks: generateTask()
                };
            case 'next':
                if (state.currTask < 0 || state.currTask >= config.taskNum) { return state; }
                clearTimeout(taskTimeout);
                if (state.currTask + 1 !== config.taskNum) {
                    taskTimeout = setTimeout(() => dispatch('next'), config.t2);
                }
                return {
                    ...state,
                    click: false,
                    pos: config.initPos,
                    currTask: state.currTask + 1,
                };
            case 'click':
                if (state.currTask < 0 || state.currTask >= config.taskNum) { return state; }
                if (state.click) { return state; }
                clearTimeout(taskTimeout);
                setTimeout(() => dispatch('next'), config.duration);
                return {
                    ...state,
                    click: true
                };
            case 'up':
                if (state.currTask < 0 || state.currTask >= config.taskNum) { return state; }
                return {
                    ...state,
                    pos: move(state, -1, 0)
                };
            case 'down':
                if (state.currTask < 0 || state.currTask >= config.taskNum) { return state; }
                return {
                    ...state,
                    pos: move(state, 1, 0)
                };
            case 'left':
                if (state.currTask < 0 || state.currTask >= config.taskNum) { return state; }
                return {
                    ...state,
                    pos: move(state, 0, -1)
                };
            case 'right':
                if (state.currTask < 0 || state.currTask >= config.taskNum) { return state; }
                return {
                    ...state,
                    pos: move(state, 0, 1)
                };
            case 'end':
                if (state.currTask < 0 || state.currTask >= config.taskNum) { return state; }
                return {
                    ...state,
                    pos: config.initPos,
                    currTask: -1,
                    click: false
                }
            default:
                throw new Error();
        }
    };
    const [state, dispatch] = useReducer(reducer, { pos: config.initPos, currTask: -1, click: false });


    useEffect(() => {
        window.addEventListener('keydown', (event) => {
            console.log("in key down" + event.code);
            switch (event.code) {
                case 'ArrowLeft':
                    event.preventDefault();
                    dispatch('left');
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    dispatch('right');
                    return;
                case 'ArrowUp':
                    event.preventDefault();
                    dispatch('up');
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    dispatch('down');
                    return;
                case 'Space':
                    event.preventDefault();
                    dispatch('click');
                    return;
                default:
                    return;
            }
        });
        console.log("trying to connect to " + document.domain + ':8080');
        const socket = io(document.domain + ':8080');
        socket.on('connect', () => {
            console.log(document.domain + ':8080' + ' connected!!');
        });
        socket.on('data', function (data) {
            let lines = data.split('\n');
            lines.forEach(element => {
                if (element.length > 0) {
                    console.log('[socket] dispatch : ' + element);
                    dispatch(element);
                }
            });
        });
    }, []);

    // eslint-disable-next-line prefer-const
    let buttons = [];
    for (let i = 0; i < config.row * config.col; i += 1) {
        let status = 'normal';
        if (state.pos[0] * config.col + state.pos[1] === i) {
            status = state.click ? 'clicked' : 'selected';
        }
        buttons.push(
            <Col key={i.toString()} span={24 / config.col}>
                <Avatar shape="square" size={128} className={status}>{config.labels[i]}</Avatar>
            </Col>,
        );
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


    return (
        <FullScreen handle={fullScreenHandle} >
            <Card title="Gloves" extra={settingsExtra()} headStyle={{ background: '#323233', color: '#888e8e', border: '0px' }} style={{ height: '100%' }} bodyStyle={{ height: '100%', background: '#1e1e1e', border: '0px' }} >
                <div style={{ textAlign: 'center' }}>
                    <Button style={{ background: '#a9a9a9', border: '0px', margin: '10px' }} onClick={() => dispatch('start')} disabled={state.currTask >= 0 && state.currTask < config.taskNum}>开始</Button>
                    <Button style={{ background: '#a9a9a9', border: '0px', margin: '10px' }} onClick={() => dispatch('next')} disabled={state.currTask < 0 || state.currTask >= config.taskNum}>下一个</Button>
                    <Button style={{ background: '#a9a9a9', border: '0px', margin: '10px' }} onClick={() => dispatch('end')} disabled={state.currTask < 0 || state.currTask >= config.taskNum}>结束</Button>
                </div>
                <div className="task">
                    {state.currTask < 0 && '未开始'}
                    {state.currTask >= 0 && state.currTask < config.taskNum
                        && `${state.currTask + 1}/${config.taskNum}:点击 ${state.tasks[state.currTask]} 按钮`}
                    {state.currTask >= config.taskNum && '已结束'}
                </div>
                <Divider />
                <Row justify="center" style={{ textAlign: 'center' }} gutter={[10, 40]}>
                    {buttons}
                </Row>
                <Drawer
                    visible={showSettings}
                    onClose={settingsClosed}
                    width={720}
                    title='设置'>
                    <Form layout='horizontal' {...formLayout}>
                        {/* <Form.Item label="绑定鼠标事件">
                            <Switch checked={useMouse} onChange={v=>setUseMouse(v)} />
                        </Form.Item> */}
                        <Divider>参数</Divider>
                        <Form.Item label="时间阈值大小">
                            <Row gutter={16}>
                                <Col flex={1}>
                                    <Form.Item label="点击持续时间(ms)" layout='horizontal'>
                                        <InputNumber min={0} max={10000} onChange={v => setConfig({ ...config, duration: v })} value={config.duration} step={1000} />
                                    </Form.Item>
                                </Col>

                                <Col flex={1}>
                                    <Form.Item label="任务持续时间(ms)" layout='horizontal'>
                                        <InputNumber min={0} max={100000} onChange={v => setConfig({ ...config, t2: v })} value={config.t2} step={1000} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>
                    </Form>
                </Drawer>
            </Card>
        </FullScreen>
    );
};

export default Gloves;
