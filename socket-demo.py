from socket import socket, AF_INET, SOCK_STREAM, timeout
import argparse
import time
import json
import sys


IP = "localhost"
# IP = "47.93.21.175"
PORT = 8081


class CursorClient:
    def __init__(self, server_addr, port, timeout=1):
        self.my_socket = socket(AF_INET, SOCK_STREAM)
        self.my_socket.settimeout(timeout)
        self.connect(server_addr, port)

    def __exit__(self, type, value, traceback):
        self.close()

    def connect(self, address, port):
        self.my_socket.connect((address, port))
        print(f"client connecting to server: {address}")

    def close(self):
        self.my_socket.close()
        print("remote client socket closed")

    def sendToKB(self, touch_state, x, y):
        paras = [touch_state, x, y]
        self.my_socket.send(
            str(" ".join([str(item) for item in paras]) + "\n").encode())

    def sendToKBPlot(self, type, touch_state, x, y):
        # type should be in ['event', 'select', 'reshape']
        paras = [type, touch_state, x, y]
        self.my_socket.send(
            str(" ".join([str(item) for item in paras]) + "\n").encode())

    def selectWord(self, selectDirection):
        paras = ["select", selectDirection]
        self.my_socket.send(
            str(" ".join([str(item) for item in paras]) + "\n").encode())

    def reshapeKB(self, pos):
        # pos should be [0-1] * 12, as q_pos.x, q_pos.y, p_pos.x ...
        paras = ['reshape'] + pos
        self.my_socket.send(
            str(" ".join([str(item) for item in paras]) + "\n").encode())

    def setCandidates(self, cands):
        # len(cands) should >= 5
        paras = ['candidates'] + cands
        while (len(paras) < 6):
            paras.append(paras[-1])
        self.my_socket.send(
            str(" ".join([str(item) for item in paras]) + "\n").encode())

    def sendButton(self, cmd):
        self.my_socket.send((cmd+"\n").encode())

    def sendPressure(self, pressure):
        self.my_socket.send(('pressure' + " " + str(pressure) + "\n").encode())

    def sendMaxForce(self, pressure):
        self.my_socket.send(('maxforce' + " " + str(pressure) + "\n").encode())

    def sendPos(self, x, y):
        paras = ['grid', x, y]
        self.my_socket.send(
            str(" ".join([str(item) for item in paras]) + "\n").encode())

    def sendPressureRate(self, target, value):
        self.my_socket.send(('rate' + " " + str(target) + " " + str(value) + "\n").encode())

    def sendTimeLeft(self, time):
        self.my_socket.send(('timeleft' + " " + str(int(time)) + "\n").encode())

    def sendCommand(self, paras):
        ## paras should be a list of str
        self.my_socket.send(str(" ".join([str(item) for item in paras]) + "\n").encode())


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ip', help='Server IP Address')
    parser.add_argument('--port', type=int, default=8081,
                        help='Server port')
    args = parser.parse_args()
    print(args)
    if args.ip:
        IP = args.ip
    if args.port:
        PORT = args.port
    my_remote_handle = CursorClient(IP, PORT)

    # for status change
    my_remote_handle.sendCommand(["status", "type"])

    # for grid
    # my_remote_handle.sendPos(0.4, 0.6)

    # for reshaping the keyboard
    # my_remote_handle.reshapeKB([0.5 * (0.9 - 0.1) / 10 + 0.1, 0.85,
    #                             -0.5 * (0.9 - 0.1) / 10 + 0.9, 0.85,
    #                             0.5 * (0.8 - 0.2) / 9 + 0.2, 0.5,
    #                             -0.5 * (0.8 - 0.2) / 9 + 0.8, 0.5,
    #                             0.5 * (0.75 - 0.25) / 9 + 0.4, 0.15,
    #                             -0.5 * (0.75 - 0.25) / 9 + 0.6, 0.15])

    # for gesture keyboard or cursor pad
    # my_remote_handle.sendToKBPlot('event', 1, 0.6, 0.75)
    # time.sleep(1)
    # my_remote_handle.sendToKBPlot('event', 2, 0.25, 0.58)
    # time.sleep(1)
    # my_remote_handle.sendToKBPlot('event', 2, 0.9, 0.75)
    # time.sleep(1)
    # my_remote_handle.sendToKBPlot('event', 2, 0.85, 0.58)
    # time.sleep(1)
    # my_remote_handle.sendToKBPlot('event', 2, 0.2777777777777778, 0.15)
    # time.sleep(1)
    # my_remote_handle.sendToKBPlot('event', 3, 0.85, 0.58)

    # for set the candidates
    # my_remote_handle.setCandidates(['hello', 'how', 'are', 'you'])
    # time.sleep(1)

    # for choose word
    # my_remote_handle.selectWord('up')
    # time.sleep(1)
    # my_remote_handle.selectWord('left')

    # # for button pad
    # my_remote_handle.sendButton('up')
    # print("up")
    # time.sleep(1)
    # my_remote_handle.sendButton('left')
    # print("left")
    # time.sleep(1)
    # my_remote_handle.sendButton('click')
    # print("click")
    # time.sleep(5)
    # my_remote_handle.sendButton('up')
    # print("up")
    # time.sleep(1)

    # for pressure test
    # my_remote_handle.sendPressureRate(150, 200)
    # time.sleep(1)
    # my_remote_handle.sendMaxForce(0.9)
    # time.sleep(1)
    # my_remote_handle.sendPressure(0.1)
    # time.sleep(1)
    # my_remote_handle.sendPressure(0.13)
    # my_remote_handle.sendPressure(0.2)
    # time.sleep(1)
    # my_remote_handle.sendPressure(0.3)
    # time.sleep(1)
    # my_remote_handle.sendPressure(0.4)
    # time.sleep(1)
    # my_remote_handle.sendPressure(0.38)
    # time.sleep(6)
    # my_remote_handle.sendPressure(0.41)

    # for Chinese Input:
    if False:
        my_remote_handle.sendButton('down')
        time.sleep(1)
        my_remote_handle.sendButton('down')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('click')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('down')
        time.sleep(1)
        my_remote_handle.sendButton('left')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('click')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('down')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('click')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('left')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('left')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('up')
        time.sleep(1)
        my_remote_handle.sendButton('right')
        time.sleep(1)
        my_remote_handle.sendButton('left')
        time.sleep(1)
        my_remote_handle.sendButton('click')
        time.sleep(1)
        my_remote_handle.sendButton('up')

    my_remote_handle.close()
