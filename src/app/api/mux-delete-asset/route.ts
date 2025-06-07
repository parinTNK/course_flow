import { NextRequest, NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    console.log(`🔍 DELETE request received for: ${assetId}`);

    if (!assetId) {
      console.error('❌ Asset ID is required but not provided');
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Attempting to delete Mux asset: ${assetId}`);

    try {
      console.log(`🎯 Step 1: Trying direct asset deletion for: ${assetId}`);
      await mux.video.assets.delete(assetId);
      console.log(`✅ Successfully deleted Mux asset: ${assetId}`);
      return NextResponse.json(
        { message: 'Asset deleted successfully' },
        { status: 200 }
      );
    } catch (assetError: any) {
      console.log(`❌ Step 1 failed - Direct asset deletion failed: ${assetError.message}`);
      try {
        console.log(`🔍 Step 2: Checking if ${assetId} is an upload ID...`);
        const upload = await mux.video.uploads.retrieve(assetId);
        console.log(`📊 Upload data:`, JSON.stringify(upload, null, 2));
        if (upload.asset_id) {
          console.log(`🔄 Found asset ${upload.asset_id} for upload ${assetId}`);
          try {
            await mux.video.assets.delete(upload.asset_id);
            console.log(`✅ Successfully deleted asset: ${upload.asset_id}`);
            return NextResponse.json(
              { message: 'Asset deleted successfully via upload ID', deletedAssetId: upload.asset_id },
              { status: 200 }
            );
          } catch (deleteError: any) {
            if (deleteError.message?.includes("Can't delete a preparing asset")) {
              console.log(`⚠️ Asset ${upload.asset_id} is still preparing, trying to cancel upload instead`);
              try {
                await mux.video.uploads.cancel(assetId);
                console.log(`✅ Successfully cancelled upload: ${assetId}`);
                return NextResponse.json(
                  { message: 'Upload cancelled successfully (asset was preparing)' },
                  { status: 200 }
                );
              } catch (cancelError: any) {
                console.log(`❌ Failed to cancel upload: ${cancelError.message}`);
                if (cancelError.message?.includes("The upload has already completed")) {
                  console.log(`🔄 Upload completed, checking asset status and attempting deletion...`);
                  const maxAttempts = 3;
                  let attempt = 1;
                  while (attempt <= maxAttempts) {
                    try {
                      console.log(`🔍 Attempt ${attempt}/${maxAttempts}: Checking asset status...`);
                      const asset = await mux.video.assets.retrieve(upload.asset_id);
                      console.log(`📊 Asset ${upload.asset_id} status: ${asset.status}`);
                      if (asset.status === 'ready' || asset.status === 'errored') {
                        console.log(`✅ Asset is now ${asset.status}, attempting deletion...`);
                        await mux.video.assets.delete(upload.asset_id);
                        console.log(`✅ Successfully deleted asset after wait: ${upload.asset_id}`);
                        return NextResponse.json(
                          { message: `Asset deleted successfully (was ${asset.status})`, deletedAssetId: upload.asset_id },
                          { status: 200 }
                        );
                      } else if (asset.status === 'preparing') {
                        console.log(`⏳ Asset still preparing, waiting before retry...`);
                        const waitTime = Math.pow(2, attempt + 1) * 1000 + 1000;
                        console.log(`⏰ Waiting ${waitTime}ms before next attempt...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        attempt++;
                      } else {
                        console.log(`⚠️ Asset in unexpected status: ${asset.status}, trying deletion anyway...`);
                        await mux.video.assets.delete(upload.asset_id);
                        console.log(`✅ Successfully deleted asset with status ${asset.status}: ${upload.asset_id}`);
                        return NextResponse.json(
                          { message: `Asset deleted successfully (status was ${asset.status})`, deletedAssetId: upload.asset_id },
                          { status: 200 }
                        );
                      }
                    } catch (retryError: any) {
                      console.log(`❌ Attempt ${attempt} failed: ${retryError.message}`);
                      if (attempt === maxAttempts) {
                        console.log(`❌ All ${maxAttempts} attempts failed`);
                        return NextResponse.json(
                          { 
                            message: 'Asset exists but cannot be deleted automatically - will need manual cleanup later', 
                            assetId: upload.asset_id,
                            uploadId: assetId,
                            note: 'Asset may still be preparing. Try the cleanup endpoint later: /api/mux-cleanup-preparing-assets'
                          },
                          { status: 200 }
                        );
                      }
                      attempt++;
                    }
                  }
                } else {
                  console.log(`⚠️ Asset ${upload.asset_id} will remain in preparing state - may need manual cleanup`);
                  return NextResponse.json(
                    { 
                      message: 'Asset is in preparing state and cannot be deleted automatically', 
                      assetId: upload.asset_id,
                      uploadId: assetId,
                      note: 'May require manual cleanup when asset finishes preparing'
                    },
                    { status: 200 }
                  );
                }
              }
            } else {
              throw deleteError;
            }
          }
        } else {
          console.log(`⚠️ Upload ${assetId} exists but no asset created yet - attempting to cancel`);
          try {
            await mux.video.uploads.cancel(assetId);
            console.log(`✅ Successfully cancelled upload: ${assetId}`);
            return NextResponse.json(
              { message: 'Upload cancelled successfully' },
              { status: 200 }
            );
          } catch (cancelError: any) {
            console.log(`❌ Failed to cancel upload: ${cancelError.message}`);
            console.log(`📊 Cancel error details:`, JSON.stringify(cancelError, null, 2));
          }
        }
      } catch (uploadError: any) {
        console.log(`❌ Step 2 failed - Upload retrieval failed: ${uploadError.message}`);
        console.log(`📊 Upload error details:`, JSON.stringify(uploadError, null, 2));
        try {
          console.log(`🔍 Step 3: Searching all assets for ID: ${assetId}`);
          const assets = await mux.video.assets.list({ limit: 100 });
          console.log(`📊 Found ${assets.data.length} assets to search through`);
          const matchingAsset = assets.data.find(asset => 
            asset.upload_id === assetId || 
            asset.id.includes(assetId) ||
            assetId.includes(asset.id)
          );
          if (matchingAsset) {
            console.log(`🎯 Found matching asset: ${matchingAsset.id}`);
            try {
              await mux.video.assets.delete(matchingAsset.id);
              console.log(`✅ Successfully deleted matching asset: ${matchingAsset.id}`);
              return NextResponse.json(
                { message: 'Matching asset deleted successfully', deletedAssetId: matchingAsset.id },
                { status: 200 }
              );
            } catch (deleteError: any) {
              if (deleteError.message?.includes("Can't delete a preparing asset")) {
                console.log(`⚠️ Matching asset ${matchingAsset.id} is still preparing - trying retry logic...`);
                const maxAttempts = 3;
                let attempt = 1;
                while (attempt <= maxAttempts) {
                  try {
                    console.log(`🔍 Retry attempt ${attempt}/${maxAttempts}: Checking asset status...`);
                    const asset = await mux.video.assets.retrieve(matchingAsset.id);
                    console.log(`📊 Asset ${matchingAsset.id} status: ${asset.status}`);
                    if (asset.status === 'ready' || asset.status === 'errored') {
                      console.log(`✅ Asset is now ${asset.status}, attempting deletion...`);
                      await mux.video.assets.delete(matchingAsset.id);
                      console.log(`✅ Successfully deleted asset after retry: ${matchingAsset.id}`);
                      return NextResponse.json(
                        { message: `Asset deleted successfully after retry (was ${asset.status})`, deletedAssetId: matchingAsset.id },
                        { status: 200 }
                      );
                    } else if (asset.status === 'preparing') {
                      console.log(`⏳ Asset still preparing, waiting before retry...`);
                      const waitTime = Math.pow(2, attempt + 1) * 1000 + 1000;
                      console.log(`⏰ Waiting ${waitTime}ms before next retry...`);
                      await new Promise(resolve => setTimeout(resolve, waitTime));
                      attempt++;
                    } else {
                      console.log(`⚠️ Asset in unexpected status: ${asset.status}, trying deletion anyway...`);
                      await mux.video.assets.delete(matchingAsset.id);
                      console.log(`✅ Successfully deleted asset with status ${asset.status}: ${matchingAsset.id}`);
                      return NextResponse.json(
                        { message: `Asset deleted successfully (status was ${asset.status})`, deletedAssetId: matchingAsset.id },
                        { status: 200 }
                      );
                    }
                  } catch (retryError: any) {
                    console.log(`❌ Retry attempt ${attempt} failed: ${retryError.message}`);
                    if (attempt === maxAttempts) {
                      console.log(`❌ All ${maxAttempts} retry attempts failed`);
                      return NextResponse.json(
                        { 
                          message: 'Found asset but it is in preparing state and cannot be deleted after retries', 
                          assetId: matchingAsset.id,
                          uploadId: assetId,
                          note: 'Asset will need manual cleanup when preparation finishes'
                        },
                        { status: 200 }
                      );
                    }
                    attempt++;
                  }
                }
              } else {
                throw deleteError;
              }
            }
          } else {
            console.log(`❌ No matching asset found for upload ID: ${assetId}`);
          }
        } catch (searchError: any) {
          console.log(`❌ Step 3 failed - Asset search failed: ${searchError.message}`);
          console.log(`📊 Search error details:`, JSON.stringify(searchError, null, 2));
        }
      }
      console.log(`❌ All deletion attempts failed, throwing original error: ${assetError.message}`);
      throw assetError;
    }

    console.log(`✅ Deletion process completed for: ${assetId}`);

    return NextResponse.json(
      { message: 'Deletion process completed' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Top level error in DELETE function:', {
      error: error.message,
      status: error.status,
      assetId: new URL(request.url).searchParams.get('assetId'),
      errorType: typeof error,
      errorConstructor: error.constructor.name,
      fullError: JSON.stringify(error, null, 2)
    });

    if (error.status === 404 || error.message?.includes('not found')) {
      console.log('Asset not found - probably already deleted');
      return NextResponse.json(
        { message: 'Asset not found (may already be deleted)' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to delete asset',
        details: error.message || 'Unknown error',
        assetId: new URL(request.url).searchParams.get('assetId')
      },
      { status: 500 }
    );
  }
}
