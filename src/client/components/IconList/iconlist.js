import { FullscreenExitOutlined, FullscreenOutlined, SettingOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Drawer, Form, InputNumber, Row, Space, Switch, Button } from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import io from 'socket.io-client';
import { Debugout } from 'debugout.js';
import ReactHoverObserver from 'react-hover-observer';
import './iconlist.css';

const bugout = new Debugout({ useTimestamps: true, realTimeLoggingOn: true });


const IconList = (props) => {
    const canvasRef = useRef({ 'width': 450, 'height': 450 });
    //const cursorPos = useRef(null);
    const [showSettings, setShowSettings] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(450);
    const [canvasHeight, setCanvasHeight] = useState(450);
    const [row, setRow] = useState(10);
    const [col, setCol] = useState(10);
    const fullScreenHandle = useFullScreenHandle();
    const [hasTarget, setHasTarget] = useState(false);
    const [target, setTarget] = useState(0);

    const [reached, setReached] = useState(false);
    const [lastTime, setLasttime] = useState(0);
    const [holdTime, setHoldTime] = useState(0);
    const [logOutput, setLogoutput] = useState('');
    const [rowNum, setRowNum] = useState(6)
    const [colNum, setColNum] = useState(10)

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
        let newTarget = Math.floor(Math.random() * rowNum * colNum);
        if (rowNum * colNum != 1) {
            while (target == newTarget) {
                newTarget = Math.floor(Math.random() * rowNum * colNum);
            }
        }
        setTarget(newTarget);
        setReached(false);
        bugout.log('setTarget at ', newTarget);
    }

    const Label = ({ isHovering = false, keyId = 0, setReachedIn }) => {
        let classNameIn = "observer";
        if (isHovering) classNameIn = "hover_observer"
        if (keyId == target) {
            if (isHovering && !reached) {
                setReachedIn(true);
                setHoldTime(0);
                classNameIn = "reached_observer";
            } else if (!isHovering) {
                setReachedIn(false);
            }
            classNameIn = "target_observer";
            if (isHovering && reached) {
                classNameIn = "reached_observer";
            }
        }
        return (
            <div className={classNameIn}>
                {/* Is Hovering: {isHovering ? 'true' : 'false'} */}
                {/* Key Id: {keyId} */}
            </div>
        )
    }

    const singleIcon = (keyId, setReachedIn) => {
        return (
            <ReactHoverObserver
            >
                <Label{...{
                    keyId: keyId,
                    setReachedIn: setReachedIn,
                }}></Label>
            </ReactHoverObserver>
        )
    }

    var icons = []
    for (let j = 0; j < rowNum; j++) {
        var iconLine = [];
        for (let i = 0; i < colNum; i++) {
            iconLine.push(<div key={j * colNum + i}>{singleIcon(j * colNum + i, setReached)}</div>)
        }
        icons.push(<Row style={{ textAlign: 'center', height: '100%' }} justify="center" align="middle" key={j}>{iconLine}</Row>)
    }

    const checkReached = () => {
        if (reached) {
            let timeStamp = new Date().getTime();
            // console.log(timeStamp - holdTime)
            if (holdTime == 0) {
                setHoldTime(timeStamp);
            } else {
                if (timeStamp - holdTime > 300) {
                    setReached(false);
                    bugout.log('reach', timeStamp);
                    bugout.log('time', timeStamp - lastTime);
                    setHoldTime(0);
                    setRandomTarget();
                }
            }
        }
    }

    useEffect(() => {
        let interval = setInterval(() => {
            checkReached();
        }, 50);
        return () => { clearInterval(interval) }
    }, [reached, holdTime]);
    
    useEffect(() => {
        bugout.log("size ", colNum, rowNum);
    }, [colNum, rowNum]);


    return (
        <FullScreen handle={fullScreenHandle}>
            <Card title="Cursor Pad" extra={settingsExtra()} style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
                <Row>
                    <Button onClick={e => { bugout.downloadLog() }}>Download Log</Button>
                </Row>
                <Row style={{ textAlign: 'center', height: '100%' }} justify="center" align="middle">
                    {icons}
                </Row>

                <Drawer
                    visible={showSettings}
                    onClose={settingsClosed}
                    width={720}
                    title='设置'>
                    <Form layout='horizontal' {...formLayout}>
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
                                        <InputNumber style={{ 'width': '100%' }} min={0} max={15} onChange={v => setRowNum(v)} value={rowNum} />
                                    </Form.Item>
                                </Col>

                                <Col flex={1}>
                                    <Form.Item label="列" layout='horizontal'>
                                        <InputNumber style={{ 'width': '100%' }} min={0} max={15} onChange={v => setColNum(v)} value={colNum} />
                                    </Form.Item>
                                </Col>
                            </Row>
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

export default IconList;