import { NextRequest, NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking for preparing assets that can now be deleted...');

    // Get all assets
    const assets = await mux.video.assets.list({ limit: 100 });
    
    const preparingAssets = assets.data.filter(asset => asset.status === 'preparing');
    const readyAssets = assets.data.filter(asset => asset.status === 'ready');
    
    console.log(`📊 Found ${preparingAssets.length} preparing assets and ${readyAssets.length} ready assets`);
    
    let deletedCount = 0;
    const results = [];
    
    // Try to delete ready assets that might have been created from cancelled uploads
    for (const asset of readyAssets) {
      try {
        // Only try to delete assets without playback policies (likely from cancelled uploads)
        if (!asset.playback_ids || asset.playback_ids.length === 0) {
          await mux.video.assets.delete(asset.id);
          deletedCount++;
          results.push({
            assetId: asset.id,
            status: 'deleted',
            reason: 'No playback IDs - likely from cancelled upload'
          });
          console.log(`✅ Deleted orphaned asset: ${asset.id}`);
        }
      } catch (error: any) {
        results.push({
          assetId: asset.id,
          status: 'failed',
          error: error.message
        });
        console.warn(`❌ Failed to delete asset ${asset.id}:`, error.message);
      }
    }

    return NextResponse.json({
      message: `Cleanup completed. Deleted ${deletedCount} orphaned assets.`,
      totalAssets: assets.data.length,
      preparingAssets: preparingAssets.length,
      readyAssets: readyAssets.length,
      deletedCount,
      results
    });

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error.message },
      { status: 500 }
    );
  }
}
