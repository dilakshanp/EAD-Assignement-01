package com.sliit.solarmicrogrid;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

public class QrCodeView extends View {
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private String value = "";

    public QrCodeView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public void setValue(String value) {
        this.value = value == null ? "" : value;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int size = Math.min(getWidth(), getHeight());
        int left = (getWidth() - size) / 2;
        int top = (getHeight() - size) / 2;
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.WHITE);
        canvas.drawRect(left, top, left + size, top + size, paint);

        int cells = 25;
        float cell = size / (float) cells;
        paint.setColor(Color.rgb(15, 23, 42));
        drawFinder(canvas, left, top, cell, 1, 1);
        drawFinder(canvas, left, top, cell, cells - 8, 1);
        drawFinder(canvas, left, top, cell, 1, cells - 8);

        int seed = value.hashCode();
        for (int y = 0; y < cells; y++) {
            for (int x = 0; x < cells; x++) {
                if (isFinderArea(x, y, cells)) continue;
                int bit = Integer.rotateLeft(seed ^ (x * 73856093) ^ (y * 19349663), (x + y) % 16);
                if ((bit & 3) == 0) {
                    canvas.drawRect(left + x * cell, top + y * cell, left + (x + 1) * cell, top + (y + 1) * cell, paint);
                }
            }
        }
    }

    private boolean isFinderArea(int x, int y, int cells) {
        return (x < 9 && y < 9) || (x > cells - 10 && y < 9) || (x < 9 && y > cells - 10);
    }

    private void drawFinder(Canvas canvas, int left, int top, float cell, int startX, int startY) {
        paint.setColor(Color.rgb(15, 23, 42));
        canvas.drawRect(left + startX * cell, top + startY * cell, left + (startX + 7) * cell, top + (startY + 7) * cell, paint);
        paint.setColor(Color.WHITE);
        canvas.drawRect(left + (startX + 1) * cell, top + (startY + 1) * cell, left + (startX + 6) * cell, top + (startY + 6) * cell, paint);
        paint.setColor(Color.rgb(15, 23, 42));
        canvas.drawRect(left + (startX + 2) * cell, top + (startY + 2) * cell, left + (startX + 5) * cell, top + (startY + 5) * cell, paint);
    }
}
