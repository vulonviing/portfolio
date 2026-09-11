// Language-independent shape of the 12-layer stack. Prose for each layer
// lives in i18n/translations.js under stack.layers[id] and must stay
// structurally parallel to this array (same ids, same order). Code samples
// and literature terms are not translated, so they live here once.

export const layers = [
  {
    id: 'tensor',
    number: '01',
    terms: ['Tensor', 'Storage', 'Shape', 'Stride', 'Layout', 'dtype', 'View'],
    animation: { kind: 'grid', variant: 'stride', cols: 4, rows: 3 },
    code: `struct Tensor {
  void* data;
  std::vector<int64_t> shape;
  std::vector<int64_t> strides;
  DType dtype;
  Device device;
  bool requires_grad;
};

x = torch.randn(3, 4, device="cuda")
x.shape    # [3, 4]
x.stride() # (4, 1)
x.device   # cuda:0`,
  },
  {
    id: 'allocator',
    number: '02',
    terms: ['Caching allocator', 'Memory pool', 'Arena allocator'],
    animation: { kind: 'cycle', variant: 'pool' },
    code: `class GPUAllocator {
  unordered_map<size_t, vector<void*>> free_blocks;

  void* allocate(size_t bytes) {
    auto& blocks = free_blocks[bytes];
    if (!blocks.empty()) {
      void* ptr = blocks.back();
      blocks.pop_back();
      return ptr;
    }
    void* ptr;
    cudaMalloc(&ptr, bytes);
    return ptr;
  }

  void release(void* ptr, size_t bytes) {
    free_blocks[bytes].push_back(ptr);
  }
};`,
  },
  {
    id: 'operator',
    number: '03',
    terms: ['Operator', 'Op schema'],
    animation: { kind: 'route', stops: ['torch.add(a, b)', 'schema check', 'aten::add'] },
    code: `Tensor add(const Tensor& a, const Tensor& b);
Tensor matmul(const Tensor& a, const Tensor& b);

TORCH_LIBRARY(myops, m) {
  m.def("add(Tensor a, Tensor b) -> Tensor");
}

c = torch.add(a, b)   # or: c = a + b`,
  },
  {
    id: 'dispatcher',
    number: '04',
    terms: ['Dispatch key', 'Registry'],
    animation: {
      kind: 'route',
      branches: ['CPU', 'CUDA', 'ROCm'],
      activeBranch: 1,
      stop: 'add_cuda(a, b)',
    },
    code: `Tensor add(const Tensor& a, const Tensor& b) {
  if (a.device == Device::CPU)  return add_cpu(a, b);
  if (a.device == Device::CUDA) return add_cuda(a, b);
  throw std::runtime_error("unsupported device");
}

TORCH_LIBRARY_IMPL(myops, CPU, m)  { m.impl("add", &add_cpu); }
TORCH_LIBRARY_IMPL(myops, CUDA, m) { m.impl("add", &add_cuda); }`,
  },
  {
    id: 'backend',
    number: '05',
    terms: ['Kernel launcher', 'Native implementation'],
    animation: { kind: 'route', stops: ['check device', 'allocate output', 'launch kernel'] },
    code: `Tensor add_cuda(const Tensor& a, const Tensor& b) {
  assert(a.device == CUDA && b.device == CUDA);
  Tensor out = empty_like(a);

  int n = a.numel();
  int threads = 256;
  int blocks = (n + threads - 1) / threads;

  add_kernel<<<blocks, threads>>>(
    (float*)a.data, (float*)b.data, (float*)out.data, n
  );
  return out;
}`,
  },
  {
    id: 'kernel',
    number: '06',
    terms: ['Grid', 'Thread Block', 'Thread', 'Warp', 'Streaming Multiprocessor', 'SIMT'],
    animation: { kind: 'grid', variant: 'warp', cols: 32, rows: 2 },
    code: `__global__ void add_kernel(
  const float* a, const float* b, float* out, int n
) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) out[i] = a[i] + b[i];
}

int threads = 256;
int blocks = (n + threads - 1) / threads;
add_kernel<<<blocks, threads>>>(a, b, out, n);`,
  },
  {
    id: 'vendor',
    number: '07',
    terms: ['cuBLAS', 'cuDNN', 'cuFFT', 'Primitive libraries'],
    animation: { kind: 'route', stops: ['your call', 'cuBLAS / cuDNN / cuFFT', 'optimized kernel'] },
    code: `// matmul → cuBLAS
cublasSgemm(handle, ..., A, B, C);

// conv2d → cuDNN
cudnnConvolutionForward(handle, ...);

// FFT → cuFFT
cufftExecC2C(plan, in, out, CUFFT_FORWARD);`,
  },
  {
    id: 'runtime',
    number: '08',
    terms: ['Stream', 'Event', 'Asynchronous execution', 'Synchronization'],
    animation: { kind: 'cycle', variant: 'async' },
    code: `cudaStream_t stream;
cudaStreamCreate(&stream);

add_kernel<<<blocks, threads, 0, stream>>>(a, b, out, n);
printf("CPU keeps going\\n"); // kernel runs async

cudaStreamSynchronize(stream);`,
  },
  {
    id: 'autograd',
    number: '09',
    terms: ['Reverse-mode AD', 'Computation graph', 'Tape', 'Gradient engine'],
    animation: { kind: 'graph', variant: 'autograd' },
    code: `struct Node {
  vector<Tensor*> parents;
  virtual void backward(Tensor grad_output) = 0;
};

class MulBackward : public Node {
  Tensor *a, *b;
  void backward(Tensor grad) override {
    a->grad += grad * (*b);   // dy/da = b
    b->grad += grad * (*a);   // dy/db = a
  }
};`,
  },
  {
    id: 'frontend',
    number: '10',
    terms: ['Module', 'Parameter', 'Optimizer'],
    animation: { kind: 'graph', variant: 'compose' },
    code: `class Linear(Module):
  def __init__(self, in_features, out_features):
    self.weight = Parameter(randn(in_features, out_features))

  def forward(self, x):
    return matmul(x, self.weight)

model = Linear(768, 3072)
y = model(x)`,
  },
  {
    id: 'compiler',
    number: '11',
    terms: ['IR', 'Graph capture', 'Fusion', 'JIT', 'AOT'],
    animation: { kind: 'graph', variant: 'fuse' },
    code: `// 3 kernels: add → relu → mul
%0 = input
%1 = add(%0, 1)
%2 = relu(%1)
%3 = mul(%2, 2)

// fused into 1 kernel
__global__ void fused_kernel(float* x, float* out, int n) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) {
    float v = x[i];
    v = max(v + 1.0f, 0.0f);
    out[i] = v * 2.0f;
  }
}`,
  },
  {
    id: 'bindings',
    number: '12',
    terms: ['FFI', 'Python bindings', 'Native extension'],
    animation: { kind: 'route', stops: ['Python call', 'pybind11 boundary', 'compiled C++'] },
    code: `#include <pybind11/pybind11.h>

Tensor add(Tensor a, Tensor b);

PYBIND11_MODULE(my_tensor_lib, m) {
  m.def("add", &add);
}

import my_tensor_lib
c = my_tensor_lib.add(a, b)`,
  },
];
