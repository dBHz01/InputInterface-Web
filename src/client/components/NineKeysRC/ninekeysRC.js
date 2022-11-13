import { FullscreenExitOutlined, FullscreenOutlined, SettingOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Drawer, Form, InputNumber, Row, Space, Switch } from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useRef, useState, useReducer } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import io from 'socket.io-client';
import Selector from './Selector';
import './ninekeysRC.css';


const ninekeysRC = (props) => {
    const [showSettings, setShowSettings] = useState(false);
    const fullScreenHandle = useFullScreenHandle();
    const candidateLength = 4;

    const reducer = (state, action) => {
        let actionList = action.split(" ");
        let actionType = actionList[0];
        let actionContent = actionList.slice(1);
        switch (actionType) {
            case "chosenId":
                return {
                    ...state,
                    chosenId: parseInt(actionContent[0]),
                }
            case "curText":
                return {
                    ...state,
                    curText: actionContent,
                }
            case "curArea":
                return {
                    ...state,
                    curArea: actionContent[0],
                }
            case "candidates":
                return {
                    ...state,
                    candidates: actionContent,
                }
            case "candidatePinyin":
                return {
                    ...state,
                    candidatePinyin: actionContent,
                }
            case "highLightPinyin":
                return {
                    ...state,
                    highLightPinyinId: parseInt(actionContent[0]),
                }
            case "highLightCand":
                return {
                    ...state,
                    highLightCandId: parseInt(actionContent[0]),
                }
            default:
                break;
        }
    }

    const [state, dispatch] = useReducer(reducer, {'status': 'idle', message: ['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'], chosenId: -1, candidates: [], candidatePinyin: [], curText: "", curArea: "INPUT", highLightPinyinId: -1, highLightCandId: -1});



    useEffect(() => {
        console.log("trying to connect to "+ document.domain+':8080');
        const socket = io(document.domain+':8080');
        socket.on('connect', () => {
            console.log(document.domain+':8080'+'connected!!');
        });
        socket.on('data', function(data) {
            let lines = data.split('\n');
            lines.forEach(element => {
                if (element.length > 0) {
                    console.log('[socket] dispatch : ' + element);
                    dispatch(element);
                }
            });
        });
        return function closeSocket() {
            socket.close();
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', (event) => {
            console.log("in key down|" + event.code+"|");
            switch (event.code) {
                case 'ArrowLeft':
                    event.preventDefault();
                    dispatch('left');
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    dispatch('right');
                    return;
                case 'Space':
                    event.preventDefault();
                    dispatch('click');
                    return;
                case 'ArrowUp':
                    event.preventDefault();
                    dispatch('up');
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    dispatch('down');
                    return;
                default:
                    return;
            }
        });
    }, []);


    let settingsExtra = () => (
        <Space>
        <SettingOutlined onClick={event=>setShowSettings(true)}/>
        {fullScreenHandle.active
          ? <FullscreenExitOutlined onClick={fullScreenHandle.exit}/>
          : <FullscreenOutlined onClick={fullScreenHandle.enter}/>
        }
        </Space>
    );

    let settingsClosed = () => {
        setShowSettings(false);
    }

    let showPinyin = []
    for (let i in state.candidatePinyin) {
        showPinyin.push(
            <span className={`cand-text ${state.highLightPinyinId == i ? "highlight-text" : ""}`}>{state.candidatePinyin[i]}</span>
        )
    }

    let showCand = []
    let showCandRange = []
    if (state.highLightCandId == -1) {
        for (let i = 0; i < candidateLength; i++) {
            showCandRange.push(i);
        }
    } else {
        let rangeStart = Math.floor(state.highLightCandId / 4) * 4;
        console.log(rangeStart)
        for (let i = rangeStart; i < rangeStart + candidateLength; i++) {
            showCandRange.push(i);
        }
    }
    for (let i of showCandRange) {
        showCand.push(
            <span className={`cand-text ${state.highLightCandId == i ? "highlight-text" : ""}`}>{state.candidates[i]}</span>
        )
    }

    return (
      <FullScreen handle={fullScreenHandle}>
      <Card title="中文输入" extra={settingsExtra()} style={{height: '100%', textAlign:'center'}} bodyStyle={{height: '100%'}}>
          <h3 className={state.curArea === "INPUT" ? "selected-area" : ""}>当前输入：{state.curText}</h3>
          <h3 className={state.curArea === "SELECT_PINYIN" ? "selected-area" : ""}>拼音候选：{showPinyin}</h3>
          <h3 className={state.curArea === "SELECT_CAND" ? "selected-area" : ""}>汉字候选：{showCand}</h3>
          <Selector data={state.message} radius={200} hasCenter={true} chosenId={state.chosenId}/>
        <Drawer 
              visible={showSettings} 
              onClose={settingsClosed}
              width={720}
              title='设置'>
            </Drawer>
      </Card>   
      </FullScreen> 
    );
}

export default ninekeysRC;