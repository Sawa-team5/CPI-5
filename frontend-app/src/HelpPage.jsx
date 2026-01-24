import React, { useState, useEffect } from 'react';
import img1 from './assets/1.png';
import img2 from './assets/2.png';
import img3 from './assets/3.png';
import img4 from './assets/4.png';
import img5 from './assets/5.png';

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        width: windowSize.width,
        height: windowSize.height,
        isMobile: windowSize.width < 768 || windowSize.height < 500,
    };
};

const HelpPage = () => {
    const { isMobile } = useWindowSize();
    const [currentIndex, setCurrentIndex] = useState(0);

    // 各スライドの内容定義
    const helpSteps = [
        {
            title: "1. テーマを選ぶ",
            description: "サイドバーまたは中央のバブルから、気になるテーマを選択してください。",
            image: img1
        },
        {
            title: "2. 意見を見る",
            description: "配置されたバブルをクリックすると、それぞれの詳しい意見が表示されます。",
            image: img2
        },
        {
            title: "3. 自分のスタンスを決める",
            description: "「賛成」か「反対」を選んで、議論に参加しましょう。",
            image: img3
        },
        {
            title: "4. AIと対話する",
            description: "チャットモードでAIと対話しながら、自分の考えを深めることができます。",
            image: img4
        },
        {
            title: "5. 自分の意見が変化する",
            description: "意見をクリックしたり、それに賛成/反対を述べると、自分の立場が変化します。自分の立場が今どこにあるのか、常に確認できます。",
            image: img5
        }
    ];

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === helpSteps.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? helpSteps.length - 1 : prev - 1));
    };

    return (
        <div style={{
            /* 画面全体のパディング調整 */
            padding: isMobile ? '10px' : '20px',
            fontSize: isMobile ? '1rem' : '1.2rem',
            maxWidth: '100%',
            margin: '0 auto',
            textAlign: 'center'
        }}>
            <h1 style={{
                /* タイトルの文字サイズ調整 */
                fontSize: isMobile ? '1.3rem' : '2rem',
                marginBottom: '10px',
                color: '#333'
            }}>
                Kaleidoscope の使い方
            </h1>

            {/* --- スライドの外枠（コンテナ）の調整エリア --- */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                /* 横幅：画面に対してスライド枠をどのくらいの幅で出すか */
                width: isMobile ? '85%' : '80%', 
                /* ★重要：高さ調整
                   画像＋文字が入り切らない場合は、ここの数値を大きくしてください。
                   スマホ版(isMobile)とPC版で別々に指定できます。 */
                height: isMobile ? '240px' : '370px', 
                maxWidth: '800px',
                margin: '0 auto',
                borderRadius: '12px',
                maxHeight: isMobile ? '220px' : '370px', // 高さを固定
                backgroundColor: '#f0f0f0', // スライドの背景色
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                {/* 横並びのスライド本体 */}
                <div style={{
                    display: 'flex',
                    transition: 'transform 0.5s ease-in-out',
                    transform: `translateX(-${currentIndex * 100}%)`,
                }}>
                    {helpSteps.map((step, index) => (
                        <div key={index} style={{
                            minWidth: '100%',
                            /* 枠線と中身の間の余白 */
                            padding: isMobile ? '15px' : '25px',
                            boxSizing: 'border-box'
                        }}>
                            {/* --- 画像のサイズ・配置調整エリア --- */}
                            <img
                                src={step.image}
                                alt={step.title}
                                style={{
                                    /* コンテナの幅に対する画像の大きさ(%) */
                                    width: isMobile ? '85%' : '75%', 
                                    /* 画像が大きくなりすぎないよう制限（スマホ用） */
                                    maxWidth: isMobile ? '240px' : '500px', 
                                    height: 'auto',
                                    borderRadius: '8px',
                                    /* 画像と下の見出しの間の距離 */
                                    marginBottom: isMobile ? '10px' : '-8px'
                                }}
                            />

                            {/* --- テキスト（見出し・説明文）の調整エリア --- */}
                            <h2 style={{ 
                                fontSize: isMobile ? '1.1rem' : '1.6rem', 
                                color: '#444',
                                marginBottom: '10px'
                            }}>
                                {step.title}
                            </h2>
                            <p style={{ 
                                /* 説明文の文字サイズと行間 */
                                fontSize: isMobile ? '0.85rem' : '1.1rem', 
                                color: '#666', 
                                lineHeight: '1.6',
                                /* PC版で見やすいように左右に余白を設ける */
                                padding: isMobile ? '0' : '0 30px' 
                            }}>
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 左右のナビゲーションボタン */}
                <button onClick={prevSlide} style={btnStyle(isMobile, 'left')}>◀</button>
                <button onClick={nextSlide} style={btnStyle(isMobile, 'right')}>▶</button>
            </div>

            {/* --- ページ下部のドット（インジケーター）の調整エリア --- */}
            <div style={{ marginTop: '15px' }}>
                {helpSteps.map((_, index) => (
                    <span
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        style={{
                            display: 'inline-block',
                            /* ドットの大きさ */
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            /* 選択中とそれ以外の色 */
                            backgroundColor: currentIndex === index ? '#37474F' : '#ccc',
                            margin: '0 5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * 左右ボタンの共通スタイル生成関数
 */
const btnStyle = (isMobile, direction) => ({
    position: 'absolute',
    top: '50%',
    [direction]: '10px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0,0,0,0.3)', // ボタンの背景（半透明黒）
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    /* ボタンのサイズ：スマホでは少し小さくしています */
    width: isMobile ? '30px' : '45px',
    height: isMobile ? '30px' : '45px',
    cursor: 'pointer',
    zIndex: 10,
    fontSize: isMobile ? '0.8rem' : '1.2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
});

export default HelpPage;