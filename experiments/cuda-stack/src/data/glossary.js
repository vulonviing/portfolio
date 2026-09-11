// Short bilingual definitions for every term chip in data/layers.js, keyed by
// the exact term string. Unlike the rest of the content, this file carries
// both languages inline instead of routing through i18n/translations.js —
// the key is the term itself (never translated), and threading 40+ keys
// through translations.js for a one-line definition each would be pure
// indirection. Keep entries short: one sentence, two at most.

export const glossary = {
  Tensor: {
    en: "A multi-dimensional array with a fixed dtype and device, described by metadata rather than copied on every operation.",
    tr: 'Sabit bir dtype ve cihaza sahip, her işlemde kopyalanmak yerine metadata ile tarif edilen çok boyutlu bir dizi.',
  },
  Storage: {
    en: "The actual contiguous block of memory a tensor's data lives in — separate from the tensor object that describes it.",
    tr: 'Tensor verisinin gerçekten yaşadığı bitişik bellek bloğu — onu tarif eden tensor nesnesinden ayrı.',
  },
  Shape: {
    en: 'The size of a tensor along each dimension, e.g. (3, 4) for a 3-row, 4-column matrix.',
    tr: 'Bir tensörün her boyuttaki boyutu, örn. 3 satır 4 sütunluk bir matris için (3, 4).',
  },
  Stride: {
    en: 'How many elements to skip in memory to move one step along a given dimension.',
    tr: 'Bir boyutta bir adım ilerlemek için bellekte kaç eleman atlanacağı.',
  },
  Layout: {
    en: "How a tensor's elements are arranged in memory — row-major, column-major, or something more specialized.",
    tr: 'Bir tensörün elemanlarının bellekte nasıl düzenlendiği — row-major, column-major ya da daha özel bir biçim.',
  },
  dtype: {
    en: 'The data type of a tensor’s elements — float32, float16, int32, and so on.',
    tr: 'Bir tensörün elemanlarının veri tipi — float32, float16, int32 gibi.',
  },
  View: {
    en: 'A tensor that shares the same underlying storage as another, just with different shape or stride metadata.',
    tr: 'Başka bir tensörle aynı alttaki storage’ı paylaşan, sadece shape ya da stride metadata’sı farklı olan tensör.',
  },
  'Caching allocator': {
    en: 'An allocator that keeps freed GPU memory in a pool instead of returning it to the driver, so the next allocation of the same size is instant.',
    tr: 'Serbest kalan GPU belleğini sürücüye iade etmek yerine bir havuzda tutan, böylece aynı boyuttaki bir sonraki ayırmayı anında yapan allocator.',
  },
  'Memory pool': {
    en: 'A reserve of pre-allocated memory blocks an allocator hands out and takes back, avoiding repeated driver calls.',
    tr: 'Bir allocator’ın dağıtıp geri aldığı, tekrar tekrar sürücü çağrısı yapmayı önleyen önceden ayrılmış bellek blokları rezervi.',
  },
  'Arena allocator': {
    en: 'An allocator that carves memory out of one large pre-reserved region instead of asking the OS or driver for each piece separately.',
    tr: 'Her parça için işletim sistemine ya da sürücüye ayrı ayrı sormak yerine belleği büyük, önceden ayrılmış tek bir bölgeden kesen allocator.',
  },
  Operator: {
    en: 'A named, registered computation — add, matmul, relu — with a schema describing its inputs and output.',
    tr: 'Girdi ve çıktısını tarif eden bir şema ile kayıtlı, isimlendirilmiş bir hesaplama — add, matmul, relu.',
  },
  'Op schema': {
    en: 'The type contract of an operator: what tensors it takes in and what it returns, independent of which backend runs it.',
    tr: 'Bir operator’ün tip kontratı: hangi tensörleri aldığı ve neyi döndürdüğü — hangi backend’in çalıştıracağından bağımsız.',
  },
  'Dispatch key': {
    en: 'A tag (like CPU, CUDA, or Autograd) the dispatcher uses to decide which registered implementation of an operator to run.',
    tr: 'Dispatcher’ın bir operator’ün hangi kayıtlı implementasyonunu çalıştıracağına karar vermek için kullandığı etiket (CPU, CUDA, Autograd gibi).',
  },
  Registry: {
    en: 'The table mapping each operator and dispatch key to its concrete implementation.',
    tr: 'Her operator ve dispatch key’i somut implementasyonuna eşleyen tablo.',
  },
  'Kernel launcher': {
    en: 'Host-side code that prepares arguments, computes thread/block counts, and starts a GPU kernel.',
    tr: 'Argümanları hazırlayan, thread/block sayısını hesaplayan ve bir GPU kernel’ini başlatan host tarafı kod.',
  },
  'Native implementation': {
    en: "The actual compiled function — C++ or CUDA — that an operator's dispatch entry points to.",
    tr: 'Bir operator’ün dispatch girdisinin işaret ettiği, gerçekten derlenmiş fonksiyon — C++ ya da CUDA.',
  },
  Grid: {
    en: 'The full set of thread blocks launched for one kernel call.',
    tr: 'Bir kernel çağrısı için başlatılan tüm thread block’ların bütünü.',
  },
  'Thread Block': {
    en: 'A group of threads that run on the same Streaming Multiprocessor and can share fast on-chip memory.',
    tr: 'Aynı Streaming Multiprocessor üzerinde çalışan ve hızlı çip-üstü belleği paylaşabilen bir thread grubu.',
  },
  Thread: {
    en: 'The smallest unit of execution in a kernel — one thread typically handles one element.',
    tr: 'Bir kernel’deki en küçük çalışma birimi — bir thread genelde bir elemanı işler.',
  },
  Warp: {
    en: 'A group of 32 threads that execute the same instruction in lockstep on NVIDIA GPUs.',
    tr: 'NVIDIA GPU’larda aynı komutu adım adım birlikte çalıştıran 32 thread’lik grup.',
  },
  'Streaming Multiprocessor': {
    en: "A GPU's core processing unit — it schedules and executes the warps assigned to it.",
    tr: 'Bir GPU’nun çekirdek işlem birimi — kendisine atanan warp’ları zamanlar ve çalıştırır.',
  },
  SIMT: {
    en: 'Single Instruction, Multiple Threads — the execution model where many threads run the same instruction on different data at once.',
    tr: 'Single Instruction, Multiple Threads — birçok thread’in aynı komutu farklı veriler üzerinde aynı anda çalıştırdığı yürütme modeli.',
  },
  cuBLAS: {
    en: "NVIDIA's hand-tuned library for dense linear algebra — matrix multiplication and friends.",
    tr: 'NVIDIA’nın yoğun lineer cebir için elle optimize ettiği kütüphane — matris çarpımı ve benzerleri.',
  },
  cuDNN: {
    en: "NVIDIA's library of optimized primitives for deep learning — convolution, pooling, normalization.",
    tr: 'NVIDIA’nın derin öğrenme için optimize edilmiş primitiflerden oluşan kütüphanesi — convolution, pooling, normalization.',
  },
  cuFFT: {
    en: "NVIDIA's library for fast Fourier transforms on the GPU.",
    tr: 'NVIDIA’nın GPU üzerinde hızlı Fourier dönüşümü için kütüphanesi.',
  },
  'Primitive libraries': {
    en: 'Vendor-maintained, heavily optimized building blocks a framework calls into instead of reimplementing the math itself.',
    tr: 'Bir framework’ün matematiği yeniden yazmak yerine çağırdığı, üretici tarafından bakımı yapılan, yoğun optimize edilmiş yapı taşları.',
  },
  Stream: {
    en: 'An ordered queue of GPU work. Operations in the same stream run in sequence; different streams can overlap.',
    tr: 'Sıralı bir GPU iş kuyruğu. Aynı stream’deki işlemler sırayla çalışır; farklı stream’ler örtüşebilir.',
  },
  Event: {
    en: 'A marker placed in a stream used to measure timing or synchronize with other streams.',
    tr: 'Zamanlama ölçmek ya da başka stream’lerle senkronize olmak için bir stream’e yerleştirilen işaretçi.',
  },
  'Asynchronous execution': {
    en: 'GPU work that starts without blocking the CPU, which keeps running other code while the GPU processes in the background.',
    tr: 'CPU’yu bloklamadan başlayan, GPU arka planda işlem yaparken CPU’nun başka kod çalıştırmaya devam ettiği çalışma biçimi.',
  },
  Synchronization: {
    en: 'The point where the CPU (or another stream) waits for GPU work to actually finish before reading its result.',
    tr: 'CPU’nun (ya da başka bir stream’in) sonucu okumadan önce GPU işinin gerçekten bitmesini beklediği nokta.',
  },
  'Reverse-mode AD': {
    en: 'Automatic differentiation that walks the computation graph backward from output to inputs, applying the chain rule once per node — efficient when there are many inputs and one output.',
    tr: 'Hesaplama grafiğini çıktıdan girdilere doğru tersine yürüyen, her düğümde bir kez zincir kuralını uygulayan otomatik türev — çok girdi, tek çıktı olduğunda verimli.',
  },
  'Computation graph': {
    en: 'The record of operations and their dependencies, built during the forward pass so it can be walked backward for gradients.',
    tr: 'Forward geçiş sırasında kurulan, gradyanlar için tersine yürünebilmesini sağlayan işlemler ve bağımlılıkları kaydı.',
  },
  Tape: {
    en: 'Another name for the recorded sequence of operations autograd replays in reverse to compute gradients.',
    tr: 'Autograd’ın gradyanları hesaplamak için tersine oynattığı kaydedilmiş işlem dizisinin başka bir adı.',
  },
  'Gradient engine': {
    en: 'The system that walks the computation graph backward, accumulating gradients at each tensor that requires them.',
    tr: 'Hesaplama grafiğini tersine yürüyen, ihtiyaç duyan her tensörde gradyan biriktiren sistem.',
  },
  Module: {
    en: 'A composable unit that bundles parameters and a forward computation — the building block of a neural network.',
    tr: 'Parametreleri ve bir forward hesaplamasını bir araya getiren, birleştirilebilir birim — bir sinir ağının yapı taşı.',
  },
  Parameter: {
    en: 'A tensor marked as learnable — requires_grad is set, and an optimizer will update it during training.',
    tr: 'Öğrenilebilir olarak işaretlenmiş bir tensör — requires_grad açık ve bir optimizer training sırasında onu günceller.',
  },
  Optimizer: {
    en: 'The algorithm that updates parameters using their gradients — SGD, Adam, and similar.',
    tr: 'Parametreleri gradyanlarını kullanarak güncelleyen algoritma — SGD, Adam ve benzerleri.',
  },
  IR: {
    en: "Intermediate Representation — a compiler's internal, simplified form of a program used for analysis and transformation.",
    tr: 'Intermediate Representation — bir derleyicinin analiz ve dönüşüm için kullandığı, programın içsel ve basitleştirilmiş biçimi.',
  },
  'Graph capture': {
    en: 'Recording a sequence of operations as a single graph a compiler can analyze and optimize as a whole.',
    tr: 'Bir dizi işlemi, bir derleyicinin bütün olarak analiz edip optimize edebileceği tek bir grafik olarak kaydetme.',
  },
  Fusion: {
    en: 'Merging multiple kernels into one, so intermediate results stay on-chip instead of round-tripping to GPU memory.',
    tr: 'Birden fazla kernel’i birleştirerek ara sonuçların GPU belleğine gidip gelmek yerine çip üzerinde kalmasını sağlama.',
  },
  JIT: {
    en: 'Just-In-Time compilation — compiling code the first time it actually runs, based on the real shapes and types it sees.',
    tr: 'Just-In-Time derleme — kodu gerçekten çalıştığı ilk anda, gördüğü gerçek shape ve tiplere göre derleme.',
  },
  AOT: {
    en: 'Ahead-Of-Time compilation — compiling code before it runs, without waiting to see real inputs.',
    tr: 'Ahead-Of-Time derleme — kodu, gerçek girdileri görmeden, çalışmadan önce derleme.',
  },
  FFI: {
    en: 'Foreign Function Interface — the mechanism that lets code in one language call functions written in another.',
    tr: 'Foreign Function Interface — bir dildeki kodun başka bir dilde yazılmış fonksiyonları çağırmasını sağlayan mekanizma.',
  },
  'Python bindings': {
    en: 'The glue code that exposes native C++/CUDA functions as callable Python objects.',
    tr: 'Native C++/CUDA fonksiyonlarını çağrılabilir Python nesneleri olarak açan bağlayıcı kod.',
  },
  'Native extension': {
    en: 'A compiled module — not plain Python — that the Python interpreter can import and call directly.',
    tr: 'Python yorumlayıcısının doğrudan import edip çağırabildiği, düz Python olmayan derlenmiş bir modül.',
  },
};
