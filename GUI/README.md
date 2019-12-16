# Electron Template

俺々Electronテンプレート．

## Usage
必要パッケージのインストール．
```
npm i
```

環境確認．
```
npm start
```

## Package update
```npm-check-updates```が無ければインストールしておく．
```
npm install -g npm-check-updates
```
globalのパスを通すのを忘れずに！  
パスは以下のコマンドで確認できる．
```
npm bin -g
```

```package.json```の更新．
```
ncu -u
```

パッケージのアップデート．
```
npm i
```

## Reference
- [npm installしたパッケージの更新確認とアップデート(npm-check-updates)](https://dackdive.hateblo.jp/entry/2016/10/10/095800)
- [npm や yarn のグローバルインストール先](https://kantaro-cgi.com/blog/nodejs/npm_and_yarn_global_install_path.html)