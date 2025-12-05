import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('file') as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'لم يتم إرسال ملف صوتي' },
                { status: 400 }
            );
        }

        // التحقق من نوع الملف
        const validTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
        if (!validTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
            return NextResponse.json(
                { error: 'صيغة الملف غير مدعومة. الصيغ المدعومة: webm, mp3, wav, ogg' },
                { status: 400 }
            );
        }

        // إعداد FormData لـ Mistral API
        const mistralFormData = new FormData();
        mistralFormData.append('file', audioFile);
        mistralFormData.append('model', 'voxtral-mini-latest');

        // إرسال الطلب إلى Mistral API
        const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
            body: mistralFormData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Mistral API Error:', errorData);
            return NextResponse.json(
                { error: 'فشل في تحويل الصوت إلى نص' },
                { status: response.status }
            );
        }

        const result = await response.json();

        return NextResponse.json({
            text: result.text,
            success: true,
        });

    } catch (error) {
        console.error('Transcription Error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء معالجة الصوت' },
            { status: 500 }
        );
    }
}
